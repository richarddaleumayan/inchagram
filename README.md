# Inchagram

A simplified, photo-only social media platform focused on core photo sharing without the complexity of modern social networks.

## ⚠️ Legal Disclaimer

**IMPORTANT:** Inchagram is an independent educational and hobby project created for learning purposes only.

- **Not Affiliated:** This project is **not affiliated with, endorsed by, or connected to Instagram, Meta Platforms, Inc., or any of its subsidiaries or affiliates**.
- **Educational Purpose:** Developed as a personal learning project to practice web development and software engineering.
- **No Copyright Infringement:** The name "Instagram" and any related trademarks are the property of Meta Platforms, Inc. No copyright or trademark infringement is intended.
- **Non-Commercial:** This is a non-commercial project for educational and hobby purposes only.
- **Original Work:** All code, features, and functionality are original implementations.

## Tech Stack

- **Backend:** Node.js 20 LTS, TypeScript 5.x, Express 4.x
- **Database:** MongoDB 7.x with Mongoose ODM
- **Storage:** AWS S3 (for photos)
- **Authentication:** JWT (7-day expiration)
- **Testing:** Jest + Supertest

## Prerequisites

- Node.js 20 LTS or higher
- MongoDB 7.x running locally or Docker
- npm or yarn package manager

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
MONGODB_URI=mongodb://localhost:27017/inchagram
PORT=3000
NODE_ENV=development
BCRYPT_ROUNDS=10
```

### 3. Start MongoDB

Using Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

Or use your locally installed MongoDB.

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 5. Run Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run only integration tests
npm run test:integration
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "user@example.com"
  },
  "message": "User registered successfully"
}
```

## Project Structure

```
inchagram/
├── src/
│   ├── config/          # Configuration (database, etc.)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/
│   ├── integration/     # Integration tests
│   └── setup.ts         # Test environment setup
├── sdlc-studio/         # Project documentation & specs
│   ├── epics/           # Feature epics
│   ├── stories/         # User stories
│   ├── plans/           # Implementation plans
│   └── test-specs/      # Test specifications
└── dist/                # Compiled TypeScript output
```

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

## Testing

The project uses Jest for testing with the following test types:

- **Integration Tests:** Test full request/response cycles including database operations
- **Test Coverage:** Minimum 80% coverage required for branches, functions, lines, and statements

### Running Tests

```bash
# All tests with coverage report
npm test

# Watch mode for development
npm run test:watch

# Only integration tests
npm run test:integration
```

## Current Implementation Status

### ✅ Completed Features (v0.1.0)

- **US0001:** User Registration API Endpoint
  - Email/username/password validation
  - Bcrypt password hashing
  - Duplicate prevention (case-insensitive)
  - 20/20 tests passing

### 🚧 In Progress

- US0002: User Login & JWT Token Generation
- US0003: JWT Authentication Middleware

### 📋 Planned

- EP0002: User Profiles & Profile Management
- EP0003: Photo Upload & Storage
- EP0004: Social Interactions (Likes & Follows)
- EP0005: Photo Feeds (Personal & Discovery)

See `sdlc-studio/` directory for complete documentation.

## Contributing

This is a learning project for the inchagram team (Richard, Mark, Ethel, Neildren).

## Legal

**Disclaimer:** Inchagram is an independent educational project. It is not affiliated with, endorsed by, or connected to Instagram, Meta Platforms, Inc., or any of its subsidiaries. The name "Instagram" and related trademarks are the property of Meta Platforms, Inc. No copyright or trademark infringement is intended. This is a non-commercial project created solely for educational and learning purposes.

## License

MIT
