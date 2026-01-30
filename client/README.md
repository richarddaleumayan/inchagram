# Inchagram Frontend

React + TypeScript + Vite frontend for the Inchagram photo-sharing platform.

## Features

- **Photo Upload**: Upload photos with optional captions
- **Authentication**: Login with JWT token authentication
- **File Validation**: Client-side validation for file type and size
- **Image Preview**: Preview photos before uploading
- **Progress Indicator**: Visual feedback during upload
- **Error Handling**: Clear error messages for validation and network issues

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **CSS3** - Styling (no framework for simplicity)

## Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:5000`

## Installation

```bash
cd client
npm install
```

## Development

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

API requests to `/api/*` are automatically proxied to the backend server at `http://localhost:5000`.

## Build

```bash
npm run build
```

The production build will be created in the `dist/` directory.

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── PhotoUpload.tsx      # Photo upload component
│   │   └── PhotoUpload.css      # Component styles
│   ├── App.tsx                  # Main app with login/auth
│   ├── App.css                  # App-level styles
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies
```

## Usage

### Login

1. Start the backend server (`npm run dev` in root directory)
2. Create a user account via API or use existing credentials
3. Log in with email and password
4. JWT token is stored in localStorage

### Upload Photos

1. Click "Select Photo" to choose an image file
2. Supported formats: JPEG, PNG, WebP (max 10MB)
3. Add an optional caption (max 2200 characters)
4. Click "Upload Photo"
5. Success message appears when upload completes

## API Integration

The frontend communicates with the backend API:

- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/photos` - Photo upload (requires JWT token)

Authentication uses Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Configuration

Vite proxy configuration in `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

## Validation

Client-side validation:
- File type: JPEG, PNG, WebP only
- File size: Maximum 10MB
- Caption length: Maximum 2200 characters

Server-side validation is also performed by the backend API.

## Future Enhancements

- Photo feed/gallery view
- User profiles
- Like/unlike functionality
- Follow/unfollow users
- Comments on photos
- Responsive mobile design
- Accessibility improvements
- Automated testing (React Testing Library)
