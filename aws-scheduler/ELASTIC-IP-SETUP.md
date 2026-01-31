# Elastic IP Setup Guide

## Problem Solved
EC2 instances get a new public IP address every time they stop/start. This breaks your frontend connection. An Elastic IP gives you a **static IP that never changes**.

---

## Current Situation

| Item | Value |
|------|-------|
| Instance ID | i-070b7480ae1b6443c |
| Current Public IP | 18.234.175.178 (temporary) |
| Elastic IP | Not allocated yet |

---

## Step 1: Allocate Elastic IP (AWS Console)

1. **Go to EC2 Console**
   - Navigate to: EC2 → Network & Security → **Elastic IPs**

2. **Allocate New IP**
   - Click: **Allocate Elastic IP address**
   - Network Border Group: (leave default - your region)
   - Public IPv4 address pool: **Amazon's pool of IPv4 addresses**
   - Tags (optional):
     - Key: `Name`, Value: `inchagram-backend-eip`
   - Click: **Allocate**

3. **Note the New IP**
   - You'll see something like: `54.123.45.67`
   - Copy this IP address!

4. **Associate with Instance**
   - Select the newly allocated Elastic IP (checkbox)
   - Click: **Actions** → **Associate Elastic IP address**
   - Settings:
     - Resource type: **Instance**
     - Instance: **i-070b7480ae1b6443c** (inchagram-backend)
     - Private IP: (auto-selected, leave as is)
     - ✅ Allow this Elastic IP to be reassociated
   - Click: **Associate**

5. **Verify**
   - Go to: EC2 → Instances
   - Select your instance
   - Check **Public IPv4 address** - should show your Elastic IP
   - This IP will **never change** even after stop/start!

---

## Step 2: Update Frontend Configuration

### Option A: Using .env file (Development)

I've already created `client/.env` with your current IP. Update it:

1. **Open:** `client/.env`

2. **Replace the IP** with your new Elastic IP:
   ```bash
   # Before:
   VITE_API_URL=http://18.234.175.178:3000

   # After (replace with YOUR Elastic IP):
   VITE_API_URL=http://YOUR_ELASTIC_IP:3000
   ```

3. **Restart dev server:**
   ```bash
   cd client
   npm run dev
   ```

### Option B: Using domain name (Production)

If you have a domain (e.g., inchagram.com):

1. **Update DNS:**
   - Go to your DNS provider (Route53, Cloudflare, etc.)
   - Create/Update A record:
     - Name: `api.inchagram.com`
     - Type: `A`
     - Value: `YOUR_ELASTIC_IP`
     - TTL: `300` (5 minutes)

2. **Update .env:**
   ```bash
   VITE_API_URL=https://api.inchagram.com
   ```

3. **Set up SSL (optional but recommended):**
   - Use Let's Encrypt on EC2
   - Or use CloudFlare proxy (free SSL)

---

## Step 3: Test the Connection

1. **Check instance is running:**
   ```bash
   aws ec2 describe-instances --instance-ids i-070b7480ae1b6443c \
     --query 'Reservations[0].Instances[0].State.Name'
   # Should show: "running"
   ```

2. **Test API directly:**
   ```bash
   curl http://YOUR_ELASTIC_IP:3000/health
   # Should return: {"status":"ok","message":"Server is running"}
   ```

3. **Test from frontend:**
   - Open your app in browser
   - Open DevTools → Network tab
   - Try to login/register
   - Check API calls go to your Elastic IP

---

## Cost Impact on Scheduler Savings

### Original Calculation (without EIP):
- Before: $15.18/month (730 hours × $0.0208)
- After: $4.16/month (200 hours × $0.0208)
- Savings: $11.02/month = $132.24/year

### With Elastic IP:
- **When instance is RUNNING:** FREE ✅
- **When instance is STOPPED:** $0.005/hour ❌

Stopped hours per month: ~530 hours
- EIP cost: 530 × $0.005 = $2.65/month
- **New monthly cost:** $4.16 + $2.65 = $6.81
- **New savings:** $15.18 - $6.81 = $8.37/month
- **Annual savings:** $100.44/year

**Still saves 55% on EC2 costs!**

### Cost Breakdown Table:

| Scenario | EC2 Cost | EIP Cost | Total | Savings |
|----------|----------|----------|-------|---------|
| 24/7 (no schedule) | $15.18 | $0 | $15.18 | - |
| Scheduled (no EIP) | $4.16 | $0 | $4.16 | $11.02/mo |
| Scheduled + EIP | $4.16 | $2.65 | $6.81 | $8.37/mo |

**Conclusion:** Even with Elastic IP charges, you still save **$100/year**. The stable IP is worth it!

---

## Alternative: Avoid EIP Charges Completely

If you want to avoid the $2.65/month EIP charge when stopped, you have options:

### Option 1: Use Dynamic DNS
- Use a service like DuckDNS (free)
- Add a script to update DNS on instance start
- More complex setup, but $0 cost

### Option 2: Manual IP Updates
- Accept that IP changes
- Update .env manually after each restart
- Not practical for automation

### Option 3: Keep Instance Running 24/7
- Cancel the scheduler
- Keep $15.18/month cost
- Simple but expensive

### Option 4: Use a Domain with Route53 (Recommended for Production)
- Route53 costs: $0.50/month (hosted zone) + $0.40/month (queries)
- Total: ~$7.71/month (still saves $7.47/month)
- Professional setup with custom domain

---

## What Happens Now?

✅ **With Elastic IP allocated and associated:**

1. **Stop instance** (via scheduler at 6 PM or manual)
   - Instance stops
   - Elastic IP **remains associated**
   - IP **does NOT change**
   - EIP charges start: $0.005/hour

2. **Start instance** (via scheduler at 9 AM or manual)
   - Instance starts with **SAME Elastic IP**
   - Frontend works immediately (no config change needed)
   - EIP charges stop (free while running)

3. **Your app is always accessible at:**
   - `http://YOUR_ELASTIC_IP:3000`
   - No more IP changes!

---

## Quick Command Reference

### Check current Elastic IPs:
```bash
aws ec2 describe-addresses --query 'Addresses[*].[PublicIp,InstanceId,AllocationId]' --output table
```

### Release Elastic IP (if you want to remove it):
```bash
# First disassociate
aws ec2 disassociate-address --association-id eipassoc-XXXXX

# Then release
aws ec2 release-address --allocation-id eipalloc-XXXXX
```

### Check instance IP:
```bash
aws ec2 describe-instances --instance-ids i-070b7480ae1b6443c \
  --query 'Reservations[0].Instances[0].[PublicIpAddress,State.Name]' \
  --output table
```

---

## Troubleshooting

### Frontend still can't connect after EIP setup
1. Check security group allows inbound on port 3000
2. Check your backend is running: `curl http://ELASTIC_IP:3000/health`
3. Check .env file has correct IP
4. Restart frontend dev server
5. Clear browser cache

### Want to change Elastic IP later
1. Allocate new Elastic IP
2. Associate new IP with instance (will auto-disassociate old one)
3. Release old Elastic IP
4. Update .env with new IP

### Elastic IP not associating
- Check instance is in running or stopped state (not pending)
- Check you have Elastic IP quota (default is 5 per region)
- Verify you selected the correct instance

---

## Summary

✅ **What you did:**
1. Allocated static Elastic IP
2. Associated it with your EC2 instance
3. Updated frontend .env file
4. Added .env to .gitignore

✅ **What you get:**
- IP address never changes
- Scheduler works without breaking frontend
- Professional setup
- Still save $100/year

✅ **What to remember:**
- Elastic IP costs $2.65/month when instance is stopped
- Always use this IP in your configuration
- IP survives instance stop/start/reboot

**Your app is now properly configured for scheduled stop/start!** 🚀
