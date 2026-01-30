# Resend Email Service Setup

This guide will help you set up email verification for user registration using Resend (free tier: 3,000 emails/month).

## Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click **"Start Building"** or **"Sign Up"**
3. Sign up with your GitHub account or email
4. No credit card required for the free tier!

## Step 2: Get Your API Key

1. After logging in, go to **API Keys** in the dashboard
2. Click **"Create API Key"**
3. Give it a name (e.g., "Inchagram Development")
4. Select **"Sending access"** permission
5. Click **"Add"**
6. **Copy the API key** (starts with `re_...`) - you won't be able to see it again!

## Step 3: Configure Your .env File

1. Open `/Users/richarddaleumayan/Projects_Inchcape/inchagram/.env`
2. Find the line with `RESEND_API_KEY=your_resend_api_key_here`
3. Replace `your_resend_api_key_here` with your actual API key:

```env
# Email Configuration (Resend)
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=Inchagram <onboarding@resend.dev>
FRONTEND_URL=http://localhost:5173
```

**Note:** For testing, you can use the default `onboarding@resend.dev` sender. For production, you'll need to verify your own domain.

## Step 4: Restart the Server

The backend server should automatically restart if it's running via `./run-local.sh`. If not, restart it manually.

## Step 5: Test Email Verification

1. Go to [http://localhost:5173](http://localhost:5173)
2. Click **"Sign Up"**
3. Fill in username, email, and password
4. Click **"Sign Up"**
5. Check your email inbox for the verification link
6. Click the link to verify your account
7. Return to the app and log in!

## Troubleshooting

### Emails not sending?

Check the server logs for error messages like:
```
⚠️  Email service not configured. Please set RESEND_API_KEY in .env
```

This means your API key is not set correctly in `.env`.

### API key starts with `your_`?

You forgot to replace the placeholder! Get your real API key from Resend dashboard.

### Emails going to spam?

For testing with `onboarding@resend.dev`, this is normal. In production, verify your own domain in Resend to improve deliverability.

## Free Tier Limits

- **3,000 emails per month** (100/day)
- Perfect for development and small apps
- Upgrade to paid tier for more volume

## Production Setup

For production, you should:

1. **Verify your domain** in Resend
2. Update `EMAIL_FROM` to use your domain:
   ```env
   EMAIL_FROM=Inchagram <noreply@yourdomain.com>
   ```
3. Use a production Resend API key (not the dev one)
4. Set `FRONTEND_URL` to your production URL

## Support

- Resend Docs: https://resend.com/docs
- Resend Support: support@resend.com
- Inchagram Issues: Create an issue in the repo
