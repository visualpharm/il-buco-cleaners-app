# Il Buco Cleaners - Application Documentation

This document provides an overview of the Il Buco Cleaners application features and architecture.

## Overview

Il Buco Cleaners is a comprehensive cleaning management system that includes:
- Cleaning operation tracking with checklist progress
- Photo management for cleaning verification
- Analytics dashboard with click tracking
- Failure reporting with photo evidence

## Core Features

### 1. Cleaning Operations Management (`/vanish`)

- **Session Tracking**: Record cleaning sessions with start/end times
- **Checklist Progress**: Track completion of cleaning steps for different room types
- **Photo Verification**: Upload photos for specific cleaning steps
- **AI Validation**: Automated photo validation for cleaning quality
- **Failure Reporting**: Mark operations as failed with photo evidence
- **URL-based Navigation**: Persistent URLs for date-specific operation lists

### 2. Analytics Dashboard (`/analytics`)

- **Click Tracking**: Monitor user interactions across the application
- **Session Statistics**: View cleaning performance metrics
- **Failure Analysis**: Track and analyze cleaning failures

### 3. Photo Management

- **Local File Storage**: Images stored in `./uploads` directory
- **Session Organization**: Photos organized by session ID
- **Nginx Serving**: Static files served via Nginx proxy

## Technical Architecture

### Database (MongoDB)

The application uses MongoDB with the following collections:

- `cleaningSessions`: Basic cleaning session data
- `checklistProgress`: Detailed checklist completion tracking with failure status
- `photos`: Photo metadata and file references
- `clickEvents`: User interaction tracking data

### Storage

- **File System**: Local uploads directory (`./uploads`)
- **Organization**: `uploads/{sessionId}/{filename}` or `uploads/general/{filename}`
- **URL Structure**: `http://localhost:8080/uploads/{path}/{filename}`

### Key Interfaces

```typescript
interface ChecklistProgress {
  id: string;
  habitacion: string;
  tipo: string;
  horaInicio: Date;
  horaFin?: Date;
  pasos: StepData[];
  completa: boolean;
  fallado?: boolean;        // New: failure status
  fotoFalla?: string;       // New: failure photo URL
  razon?: string;
}
```

## Click Tracking System

### How It Works

1. **Automatic Tracking**: The `ClickTracker` component automatically tracks clicks on elements with `data-track` attributes
2. **Manual Tracking**: Use the `useClickTracker` hook for custom tracking
3. **Data Storage**: Click events stored in MongoDB via `/api/track-click`

### Usage

Add tracking to any element:
```html
<button data-track="cleanup-button">Clean Data</button>
```

Or use the hook:
```tsx
import { useClickTracker } from '@/hooks/useClickTracker';

function MyComponent() {
  const { trackElement } = useClickTracker();
  
  return (
    <button ref={trackElement} id="my-button">Track me</button>
  );
}
```

## API Endpoints

### Cleaning Operations
- `GET /api/vanish` - Get all cleaning operations
- `PUT /api/vanish` - Update operation status (including failure status)
- `DELETE /api/vanish` - Clear all operations
- `POST /api/upload-image` - Upload failure photos or cleaning verification images

### Analytics
- `POST /api/track-click` - Track click events
- (Analytics retrieval handled client-side)

### Sessions
- `GET /api/sessions` - Get cleaning sessions
- `POST /api/sessions` - Create new session

## Recent Updates

### Failure Tracking
- Added `fallado` and `fotoFalla` fields to operations
- Modified Status column to show "Completo" or "Con Fallas"
- Added photo capture for failed operations
- Added "Fallas" column to daily session statistics

### URL Navigation
- Implemented URL-based navigation for operation lists
- Format: `/vanish?date=YYYY-MM-DD`
- Preserves selected date on page refresh
- Enables bookmarkable operation lists

### Database Schema Updates
- Extended `ChecklistProgress` interface with failure tracking
- Added PUT endpoint to `/api/vanish` for status updates
- Enhanced photo upload handling for failure documentation

## Authentication

Simple cookie-based authentication:
- Password stored in `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable
- Default: `admin123`
- Cookie expires in 24 hours
- Required for analytics dashboard access

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   ```bash
   # .env.local
   MONGODB_URI=mongodb://localhost:27017/ilbuco-cleaners
   UPLOADS_DIR=./uploads
   NGINX_BASE_URL=http://localhost:8080
   NEXT_PUBLIC_ADMIN_PASSWORD=admin123
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Production Deployment

The application is containerized with Docker:
- Next.js application server
- Nginx for static file serving
- MongoDB for data storage
- File system storage for uploads

## Security Considerations

- Simple password authentication (upgrade for production)
- No sensitive data in click tracking
- Local file storage (no cloud dependencies)
- CORS headers configured for API endpoints