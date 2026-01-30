#!/bin/bash

# EC2 Backend Setup Script
# Run this on your EC2 instance

set -e

echo "🚀 Setting up Inchagram Backend on EC2"
echo "======================================"

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt-get install -y nginx

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/inchagram
sudo chown ubuntu:ubuntu /var/www/inchagram
cd /var/www/inchagram

# Clone repository (you'll need to set this up)
echo "Set up git access and clone your repository to /var/www/inchagram"
echo "Then run: npm install --production"

# Configure Nginx
sudo tee /etc/nginx/sites-available/inchagram << 'EOF'
server {
    listen 80;
    server_name api.inchagram.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/inchagram /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.inchagram.com --non-interactive --agree-tos -m your-email@example.com

# Set up PM2 ecosystem
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inchagram',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "1. Create .env file with production environment variables"
echo "2. Clone your repository"
echo "3. Run: npm install --production && npm run build"
echo "4. Run: pm2 start ecosystem.config.js"
echo "5. Run: pm2 save && pm2 startup"
