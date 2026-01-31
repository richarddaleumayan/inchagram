#!/bin/bash
# Deployment script for Inchagram
# Run this on EC2 after pulling latest code

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code from main..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building backend..."
npm run build

# Build frontend
echo "🎨 Building frontend..."
cd client
npm install
npm run build
cd ..

# Restart backend
echo "🔄 Restarting backend..."
pm2 restart all

# Show status
echo "✅ Deployment complete!"
pm2 status

echo ""
echo "🧪 Testing API health..."
curl -s https://api.inchagram.com/health | jq .

echo ""
echo "✅ All done! Your app is now live with the latest changes."
