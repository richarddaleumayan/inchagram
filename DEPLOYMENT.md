# Deployment Workflow Guide

## Current Setup

- **Server:** EC2 (44.196.221.8)
- **Domain:** api.inchagram.com
- **Process Manager:** PM2
- **Backend:** Node.js + TypeScript + Express
- **Frontend:** React + Vite

---

## Deployment Options

### 🟢 Option 1: Manual Deploy Script (Recommended for Now)

**On EC2, run:**

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Deploy
./deploy.sh
```

This script automatically:
- Pulls latest code
- Installs dependencies
- Builds backend and frontend
- Restarts PM2
- Tests the API

---

### 🟢 Option 2: Simple NPM Command

**On EC2, run:**

```bash
npm run deploy
```

This runs: `npm install && npm run build && pm2 restart all`

---

### 🟢 Option 3: PM2 Ecosystem (Advanced)

**Setup (one time):**

```bash
# On EC2
pm2 delete all
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow instructions
```

**Deploy:**

```bash
# From your local machine
pm2 deploy production
```

PM2 will SSH to EC2 and automatically deploy!

---

### 🟡 Option 4: GitHub Actions (Full CI/CD)

**Setup (one time):**

1. Go to GitHub repo → Settings → Secrets
2. Add: EC2_HOST, EC2_SSH_KEY
3. Push code to main branch

**Deploy:**

Just push to main - GitHub Actions automatically deploys!

---

## Quick Reference

| Task | Command |
|------|---------|
| Deploy everything | `./deploy.sh` |
| Deploy (npm) | `npm run deploy` |
| Build backend | `npm run build` |
| Restart backend | `pm2 restart all` |
| Check logs | `pm2 logs` |
