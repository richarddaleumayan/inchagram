#!/bin/bash

# Inchagram AWS Infrastructure Setup
# Run this script to set up the basic AWS infrastructure

set -e

echo "🚀 Inchagram AWS Infrastructure Setup"
echo "======================================"

# Variables
DOMAIN="inchagram.com"
AWS_REGION="us-east-1"
S3_BUCKET="inchagram-frontend"
EC2_KEY_NAME="inchagram-key"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}Step 1: Create S3 Bucket for Frontend${NC}"
aws s3 mb s3://$S3_BUCKET --region $AWS_REGION || echo "Bucket already exists"

# Keep bucket private (don't enable public access)
# CloudFront will access it via OAC (Origin Access Control)

echo -e "${GREEN}✅ S3 bucket created (kept private for security)${NC}"

echo ""
echo -e "${YELLOW}Step 2: Request SSL Certificate${NC}"
echo "Go to AWS Certificate Manager (ACM) in us-east-1 and request a certificate for:"
echo "  - inchagram.com"
echo "  - *.inchagram.com"
echo "Validate via DNS (Route 53)"
echo ""
read -p "Press Enter after certificate is issued..."

echo ""
echo -e "${YELLOW}Step 3: Create CloudFront Distribution${NC}"
echo "We'll create this via CLI..."

# Create OAC (Origin Access Control)
OAC_ID=$(aws cloudfront create-origin-access-control \
  --origin-access-control-config \
  "Name=inchagram-oac,\
SigningProtocol=sigv4,\
SigningBehavior=always,\
OriginAccessControlOriginType=s3" \
  --query 'OriginAccessControl.Id' \
  --output text 2>/dev/null || echo "")

if [ -z "$OAC_ID" ]; then
  echo "OAC already exists or error occurred. Continuing..."
  OAC_ID=$(aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='inchagram-oac'].Id | [0]" \
    --output text)
fi

echo "OAC ID: $OAC_ID"

# Get ACM Certificate ARN (you need to create this manually in us-east-1)
echo ""
echo "Looking for ACM certificate for inchagram.com..."
CERT_ARN=$(aws acm list-certificates --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='inchagram.com'].CertificateArn | [0]" \
  --output text)

if [ "$CERT_ARN" == "None" ] || [ -z "$CERT_ARN" ]; then
  echo -e "${YELLOW}⚠️  No ACM certificate found!${NC}"
  echo "Please create one manually:"
  echo "1. Go to AWS Certificate Manager (ACM) in us-east-1"
  echo "2. Request certificate for: inchagram.com, *.inchagram.com"
  echo "3. Validate via DNS"
  echo ""
  read -p "Press Enter after certificate is created and validated..."

  CERT_ARN=$(aws acm list-certificates --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='inchagram.com'].CertificateArn | [0]" \
    --output text)
fi

echo "Certificate ARN: $CERT_ARN"

# Create CloudFront distribution config
cat > /tmp/cf-config.json << EOF
{
  "Comment": "Inchagram Frontend",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$S3_BUCKET",
        "DomainName": "$S3_BUCKET.s3.$AWS_REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "$OAC_ID"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$S3_BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Aliases": {
    "Quantity": 2,
    "Items": ["inchagram.com", "www.inchagram.com"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_100"
}
EOF

echo "Creating CloudFront distribution..."
CF_DIST_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/cf-config.json \
  --query 'Distribution.Id' \
  --output text 2>/dev/null || echo "")

if [ -z "$CF_DIST_ID" ] || [ "$CF_DIST_ID" == "None" ]; then
  echo -e "${YELLOW}Could not create CloudFront via CLI. Creating manually...${NC}"
  echo "Go to CloudFront console and create with these settings:"
  echo "  - Origin: $S3_BUCKET.s3.$AWS_REGION.amazonaws.com"
  echo "  - Origin Access Control: inchagram-oac (ID: $OAC_ID)"
  echo "  - Alternate domains: inchagram.com, www.inchagram.com"
  echo "  - SSL certificate: $CERT_ARN"
  echo "  - Default root: index.html"
  echo "  - Error page: 404 -> /index.html (200)"
  read -p "Enter CloudFront Distribution ID: " CF_DIST_ID
else
  echo -e "${GREEN}✅ CloudFront distribution created: $CF_DIST_ID${NC}"

  # Update S3 bucket policy to allow CloudFront OAC
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

  cat > /tmp/bucket-policy-oac.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$CF_DIST_ID"
        }
      }
    }
  ]
}
EOF

  aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file:///tmp/bucket-policy-oac.json
  echo -e "${GREEN}✅ S3 bucket policy updated for CloudFront OAC${NC}"
fi

echo "CLOUDFRONT_DISTRIBUTION_ID=$CF_DIST_ID" >> .env.deployment

echo ""
echo -e "${YELLOW}Step 4: Create EC2 Key Pair${NC}"
aws ec2 create-key-pair \
  --key-name $EC2_KEY_NAME \
  --query 'KeyMaterial' \
  --output text > $EC2_KEY_NAME.pem
chmod 400 $EC2_KEY_NAME.pem
echo -e "${GREEN}✅ Key saved to $EC2_KEY_NAME.pem (keep this safe!)${NC}"

echo ""
echo -e "${YELLOW}Step 5: Launch EC2 Instance${NC}"
# Get latest Ubuntu AMI
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name inchagram-backend \
  --description "Inchagram backend security group" \
  --query 'GroupId' \
  --output text) || echo "Security group exists"

# Allow SSH, HTTP, HTTPS
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 || true
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 || true
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 || true

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.small \
  --key-name $EC2_KEY_NAME \
  --security-group-ids $SG_ID \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=inchagram-backend}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo -e "${GREEN}✅ EC2 instance launched: $PUBLIC_IP${NC}"
echo "EC2_HOST=$PUBLIC_IP" >> .env.deployment
echo "EC2_INSTANCE_ID=$INSTANCE_ID" >> .env.deployment

echo ""
echo -e "${YELLOW}Step 6: Configure Route 53${NC}"
echo "Add these DNS records in Route 53:"
echo "  1. A record: inchagram.com -> CloudFront distribution"
echo "  2. A record: www.inchagram.com -> CloudFront distribution"
echo "  3. A record: api.inchagram.com -> $PUBLIC_IP"
echo ""

echo ""
echo -e "${GREEN}======================================"
echo "✅ AWS Infrastructure Setup Complete!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Set up GitHub Secrets (see infrastructure/github-secrets.md)"
echo "2. SSH to EC2 and set up the backend (see infrastructure/ec2-setup.sh)"
echo "3. Push to main branch to trigger deployment"
echo ""
echo "Resources created:"
echo "  - S3 bucket: $S3_BUCKET"
echo "  - EC2 instance: $INSTANCE_ID ($PUBLIC_IP)"
echo "  - SSH key: $EC2_KEY_NAME.pem"
echo ""
echo "Configuration saved to: .env.deployment"
