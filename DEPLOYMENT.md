# Inchagram AWS Deployment Guide

Complete guide to deploy Inchagram to AWS with CI/CD.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    inchagram.com                        │
│                     (CloudFront)                        │
│                          │                              │
│                          ▼                              │
│                    ┌──────────┐                         │
│                    │ S3 Bucket│  (Frontend)             │
│                    └──────────┘                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  api.inchagram.com                      │
│                    (Route 53 → EC2)                     │
│                          │                              │
│                          ▼                              │
│         ┌────────────────────────────────┐              │
│         │  Nginx (SSL) → Node.js (PM2)  │              │
│         │           MongoDB              │              │
│         │       (EC2 t3.small)           │              │
│         └────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Cost Estimate

- **EC2 t3.small:** ~$15/month
- **S3 + CloudFront:** ~$1-5/month
- **Route 53:** ~$0.50/month
- **Total:** ~$17-20/month

## Prerequisites

- [x] AWS Account with billing enabled
- [x] Domain (inchagram.com) in Route 53
- [x] GitHub repository
- [x] AWS CLI installed locally

## Step-by-Step Deployment

### 1. Setup AWS Infrastructure

```bash
cd infrastructure
chmod +x aws-setup.sh
./aws-setup.sh
```

This script will:
- Create S3 bucket for frontend
- Guide you through CloudFront setup
- Create EC2 instance for backend
- Generate SSH key pair
- Set up security groups

### 2. Configure DNS (Route 53)

Add these records in Route 53:

| Type | Name | Value |
|------|------|-------|
| A | inchagram.com | CloudFront distribution |
| A | www.inchagram.com | CloudFront distribution |
| A | api.inchagram.com | EC2 Public IP |

### 3. Setup EC2 Backend

SSH into your EC2 instance:

```bash
chmod 400 inchagram-key.pem
ssh -i inchagram-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Run the setup script:

```bash
wget https://raw.githubusercontent.com/YOUR_USERNAME/inchagram/main/infrastructure/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### 4. Deploy Backend Code

On EC2:

```bash
cd /var/www/inchagram

# Setup git (if using private repo)
git clone git@github.com:YOUR_USERNAME/inchagram.git .

# Install dependencies
npm install --production

# Create production env file
cp .env.production.example .env
nano .env  # Fill in your values

# Build TypeScript
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions
```

### 5. Configure GitHub Secrets

Follow `infrastructure/github-secrets.md` to add required secrets to GitHub.

### 6. Test CI/CD

Push to main branch:

```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

GitHub Actions will automatically:
1. Build and deploy frontend to S3
2. Deploy backend to EC2
3. Invalidate CloudFront cache

### 7. Verify Deployment

- Frontend: https://inchagram.com
- Backend API: https://api.inchagram.com/health
- Check GitHub Actions for deployment status

## Manual Deployment (Without CI/CD)

### Frontend

```bash
cd client
npm run build
aws s3 sync dist/ s3://inchagram-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Backend

```bash
ssh -i inchagram-key.pem ubuntu@<EC2_IP>
cd /var/www/inchagram
git pull
npm install --production
npm run build
pm2 restart inchagram
```

## Database Options

### Option 1: MongoDB on EC2 (Included in setup script)
- **Cost:** Included in EC2
- **Pros:** Simple, single server
- **Cons:** Manual backups, scaling

### Option 2: MongoDB Atlas (Recommended for production)
- **Cost:** Free tier available
- **Pros:** Managed, backups, scaling
- **Setup:**
  1. Create free cluster at https://cloud.mongodb.com
  2. Add EC2 IP to whitelist
  3. Update MONGODB_URI in .env

## SSL Certificates

SSL is automatically configured by:
- **Frontend:** CloudFront uses ACM certificate
- **Backend:** Certbot sets up Let's Encrypt

Certificates auto-renew.

## Monitoring & Logs

### Backend Logs
```bash
ssh -i inchagram-key.pem ubuntu@<EC2_IP>
pm2 logs inchagram
pm2 monit
```

### CloudWatch (Optional)
Set up CloudWatch agent on EC2 for metrics and alarms.

## Troubleshooting

### Frontend not loading
- Check CloudFront distribution status
- Verify DNS propagation: `nslookup inchagram.com`
- Check S3 bucket policy

### Backend errors
```bash
ssh -i inchagram-key.pem ubuntu@<EC2_IP>
pm2 logs inchagram --lines 100
sudo nginx -t
sudo systemctl status nginx
```

### Database connection issues
```bash
sudo systemctl status mongod
mongo  # Test connection
```

## Rollback

### Frontend
Previous version is in S3 (enable versioning for easy rollback)

### Backend
```bash
ssh -i inchagram-key.pem ubuntu@<EC2_IP>
cd /var/www/inchagram
git checkout <previous-commit>
npm run build
pm2 restart inchagram
```

## Scaling (Future)

When you need to scale:
1. **Frontend:** Already scaled (CloudFront + S3)
2. **Backend:**
   - Use Application Load Balancer + Auto Scaling Group
   - Multiple EC2 instances
   - Session management with Redis
3. **Database:**
   - MongoDB Atlas with replica sets
   - Or AWS DocumentDB

## Security Checklist

- [x] EC2 security group limits SSH to your IP
- [x] SSL certificates installed
- [x] Environment variables in .env (not committed)
- [x] MongoDB authentication enabled
- [x] CORS configured properly
- [x] Rate limiting enabled
- [x] Regular security updates

## Backup Strategy

### Database Backups
```bash
# On EC2, set up daily cron job
0 2 * * * mongodump --out /backup/$(date +\%Y-\%m-\%d)

# Or use MongoDB Atlas automated backups
```

### Application Code
- GitHub repository is the source of truth
- Tag releases for easy rollback

## Cost Optimization

1. Use reserved instances for EC2 (save 30-40%)
2. Enable S3 intelligent tiering
3. Set CloudFront cache TTLs appropriately
4. Use MongoDB Atlas free tier
5. Delete old logs and backups

## Support

For issues:
1. Check GitHub Actions logs
2. Review EC2 PM2 logs
3. Check this troubleshooting guide
4. Open GitHub issue

---

**Ready to deploy?** Start with `./infrastructure/aws-setup.sh`
