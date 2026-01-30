# GitHub Secrets Configuration

Add these secrets to your GitHub repository for CI/CD:

**Settings → Secrets and variables → Actions → New repository secret**

## Required Secrets

### AWS Credentials
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```
Create an IAM user with these permissions:
- AmazonS3FullAccess
- CloudFrontFullAccess

### CloudFront
```
CLOUDFRONT_DISTRIBUTION_ID
```
Get this from CloudFront console after creating the distribution

### EC2 Access
```
EC2_HOST
```
Your EC2 instance public IP (e.g., `3.123.45.67`)

```
EC2_SSH_KEY
```
Content of your `inchagram-key.pem` file

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with exact name and value
5. Save

## Verification

After adding secrets, go to **Actions** tab and manually trigger the workflows to test.
