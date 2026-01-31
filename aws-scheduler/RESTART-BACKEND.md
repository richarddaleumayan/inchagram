# Backend Recovery Guide - After EC2 Restart

## Problem
When EC2 stops/starts, your Node.js application doesn't auto-start.

## Quick Fix (Do this now)

### Option 1: SSH and Start Manually

```bash
# 1. SSH into instance
ssh -i ~/.ssh/your-key.pem ubuntu@18.234.175.178
# Or if using ec2-instance-connect:
aws ec2-instance-connect ssh --instance-id i-070b7480ae1b6443c

# 2. Navigate to your app
cd /home/ubuntu/inchagram
# OR wherever you deployed it:
cd /var/www/inchagram

# 3. Check if it's running
pm2 status

# 4. Start if not running
pm2 start ecosystem.config.js
# OR if no PM2 config:
pm2 start npm --name "inchagram-api" -- start

# 5. Save PM2 process list
pm2 save

# 6. Set up PM2 to auto-start on reboot (do this ONCE)
pm2 startup
# Copy and run the command it outputs (it will look like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 7. Verify app is running
curl http://localhost:3000/health
# Should return: {"status":"ok","message":"Server is running"}

# 8. Exit SSH
exit
```

### Option 2: Using AWS Systems Manager (No SSH needed)

If you have SSM agent installed:

```bash
aws ssm send-command \
  --instance-ids i-070b7480ae1b6443c \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ubuntu/inchagram && pm2 restart all"]'
```

---

## Permanent Fix: Auto-Start on Boot

### Method 1: PM2 Startup (Recommended)

On your EC2 instance:

```bash
# 1. SSH into instance
ssh -i ~/.ssh/your-key.pem ubuntu@18.234.175.178

# 2. Set up PM2 startup
pm2 startup systemd

# 3. Run the command it outputs (it will give you a sudo command)

# 4. Start your app
pm2 start ecosystem.config.js
# OR
pm2 start npm --name "inchagram-api" -- start

# 5. Save the process list
pm2 save

# 6. Test reboot
sudo reboot
# Wait 2-3 minutes, then check:
curl http://api.inchagram.com/health
```

### Method 2: Systemd Service

Create a systemd service file:

```bash
# 1. Create service file
sudo nano /etc/systemd/system/inchagram.service
```

Paste this content:

```ini
[Unit]
Description=Inchagram API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/inchagram
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=inchagram-api

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
# 2. Reload systemd
sudo systemctl daemon-reload

# 3. Enable auto-start
sudo systemctl enable inchagram

# 4. Start now
sudo systemctl start inchagram

# 5. Check status
sudo systemctl status inchagram

# 6. Test reboot
sudo reboot
```

### Method 3: User Data Script (for future launches)

If you want to automate from EC2 launch:

```bash
#!/bin/bash
# Add this to EC2 User Data

# Wait for network
sleep 30

# Navigate to app
cd /home/ubuntu/inchagram

# Pull latest code (if using git)
git pull origin main

# Install dependencies
npm install --production

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## Verify Everything Works

```bash
# 1. Check instance is running
aws ec2 describe-instances --instance-ids i-070b7480ae1b6443c \
  --query 'Reservations[0].Instances[0].State.Name'

# 2. Check app responds locally
curl http://api.inchagram.com/health

# 3. Check from your frontend
# Open browser, go to your app, test login
```

---

## Common Issues

### Issue: "pm2: command not found"

PM2 not installed globally:

```bash
sudo npm install -g pm2
```

### Issue: App starts but crashes immediately

Check logs:

```bash
pm2 logs inchagram-api
# OR
sudo journalctl -u inchagram -f
```

Common causes:
- Missing .env file
- MongoDB not running
- Port 3000 already in use

### Issue: "Cannot find module"

Dependencies not installed:

```bash
cd /home/ubuntu/inchagram
npm install --production
```

### Issue: MongoDB not running

Start MongoDB:

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

### Issue: Port 3000 already in use

Find what's using it:

```bash
sudo lsof -i :3000
# Kill the process:
sudo kill -9 <PID>
```

---

## Quick Status Check Commands

Run these anytime to check status:

```bash
# App status
pm2 status

# App logs (live)
pm2 logs --lines 50

# Restart app
pm2 restart all

# Stop app
pm2 stop all

# Check what's on port 3000
sudo lsof -i :3000

# Test API
curl http://localhost:3000/health

# Check nginx
sudo systemctl status nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Current Situation

Your setup:
- ✅ EC2 instance: Running (18.234.175.178)
- ✅ DNS: api.inchagram.com → 18.234.175.178
- ✅ Nginx: Running (port 80/443)
- ❌ Node.js backend: Not running or not accessible
- ❓ PM2 auto-start: Not configured (yet)

**Next steps:**
1. SSH into instance
2. Start your Node.js app
3. Set up PM2 auto-start
4. Test everything works
5. Then allocate Elastic IP for permanent solution

---

## After You Get Backend Running

Once your backend is accessible at http://api.inchagram.com/health:

1. **Test from your local machine:**
   ```bash
   curl http://api.inchagram.com/health
   ```

2. **Update frontend .env:**
   ```bash
   # client/.env
   VITE_API_URL=http://api.inchagram.com
   # Or if you have SSL:
   VITE_API_URL=https://api.inchagram.com
   ```

3. **Restart frontend:**
   ```bash
   cd client
   npm run dev
   ```

4. **Then allocate Elastic IP** so this IP never changes again!

---

## Pro Tip: Health Check Script

Create this script to auto-restart if app crashes:

```bash
# /home/ubuntu/health-check.sh
#!/bin/bash

if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "App is down, restarting..."
    pm2 restart all
    echo "Restart attempted at $(date)" >> /var/log/inchagram-restart.log
fi
```

Add to crontab (check every 5 minutes):

```bash
crontab -e
# Add:
*/5 * * * * /home/ubuntu/health-check.sh
```

---

**Bottom line:** SSH in, start your backend, set up auto-start, then you're good to go! 🚀
