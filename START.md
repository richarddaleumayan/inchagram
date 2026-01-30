# 🚀 Running Inchagram Locally

## Prerequisites

1. **Node.js** (v18+) - Already installed ✅
2. **MongoDB** - Must be running locally
3. **AWS S3** - For photo uploads (optional for basic testing)

## Quick Start

### 1. Start MongoDB

```bash
# If you have MongoDB installed via Homebrew:
brew services start mongodb-community

# Or start manually:
mongod --config /usr/local/etc/mongod.conf

# Verify it's running:
mongosh --eval "db.version()"
```

### 2. Install Dependencies (if not already done)

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client && npm install && cd ..
```

### 3. Configure Environment

Your `.env` file should be configured with:
- MongoDB URI (default: `mongodb://localhost:27017/inchagram`)
- JWT_SECRET (generate a secure one if not set)
- AWS S3 credentials (optional - app will work without photos)

Generate JWT secret if needed:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start the Backend Server

```bash
npm run dev
```

Backend will run on: `http://localhost:3000`

### 5. Start the Frontend (in a new terminal)

```bash
cd client
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 🎉 Access the App

Open your browser to: **http://localhost:5173**

## Test Accounts

Create new accounts via the app, or use the API:

```bash
# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### MongoDB Connection Error
```
Error: MongooseError: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB (see step 1)

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Kill the process using the port:
```bash
lsof -ti:3000 | xargs kill -9
```

### AWS S3 Errors (Photo Upload)
Photos require AWS S3 credentials. If not configured:
- Profile pictures won't upload
- Photo posts won't work

**Solution:** Set up AWS credentials in `.env` or use placeholder images for testing

## Available Features

Once running, you can:

✅ Register and login
✅ View/edit your profile
✅ Upload profile pictures (requires S3)
✅ View other users' profiles
✅ Follow/unfollow users
✅ Upload photos (requires S3)
✅ Like/unlike photos
✅ View personalized feed
✅ View discovery feed
✅ Browse photo grids

## Running Tests

```bash
# Backend tests (362 tests)
npm test

# Specific test suite
npm test -- profile.test.ts

# With coverage
npm test -- --coverage
```

## Tech Stack

- **Backend:** Node.js + Express + TypeScript + MongoDB
- **Frontend:** React + TypeScript + Vite
- **Storage:** AWS S3
- **Auth:** JWT with bcrypt
- **Testing:** Jest + Supertest

Enjoy exploring Inchagram! 📸
