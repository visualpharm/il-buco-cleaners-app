# Il Buco Cleaners App - Docker Setup

This application has been refactored to run with Docker Compose using MongoDB and nginx for simplified deployment and maintenance.

## Quick Start

1. **Clone and setup environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local if needed
   ```

2. **Start the application**:
   ```bash
   npm run docker:up
   ```

3. **Access the application**:
   - Main app: http://localhost:3000
   - Image files: http://localhost:8080/uploads/
   - MongoDB: localhost:27017

4. **Stop the application**:
   ```bash
   npm run docker:down
   ```

## Architecture Changes

### Database: MongoDB (was Cloudflare D1)
- **Container**: `mongo:7`
- **Data**: Persistent volume `mongo_data`
- **Collections**: `cleaningSessions`, `photos`, `clickEvents`

### File Storage: Local filesystem + nginx (was Cloudflare R2/S3)
- **Container**: `nginx:alpine`  
- **Files**: Stored in `./uploads` directory
- **URL**: `http://localhost:8080/uploads/`

### Authentication: Simple cookie-based (was Cloudflare)
- **Method**: Basic password + cookie
- **Default password**: `admin123` (change in `.env.local`)

## Development

### Available Scripts

```bash
npm run dev          # Run Next.js development server
npm run docker:up    # Start all containers with build
npm run docker:down  # Stop all containers
npm run docker:logs  # View container logs
```

### File Structure

```
uploads/                # Image storage (mounted to nginx)
├── sessions/
│   └── {sessionId}/   # Session-specific images
└── general/           # General uploads

lib/
├── mongodb.ts         # MongoDB connection
├── database.ts        # Database operations
└── storage.ts         # File handling
```

### Environment Variables

See `.env.example` for all available configuration options.

### Database Schema

**cleaningSessions**:
- `id`: Unique session identifier
- `cleanerId`: Cleaner identifier
- `roomType`: Type of room being cleaned
- `startTime`, `endTime`: Session timing
- `status`: 'in_progress' | 'completed'
- `notes`: Optional notes

**photos**:
- `id`: Unique photo identifier
- `sessionId`: Reference to cleaning session
- `type`: 'before' | 'after'
- `filename`, `url`: File information

**clickEvents**:
- `id`: Unique event identifier
- `element`, `page`: UI tracking
- `timestamp`: When event occurred

## Troubleshooting

### Container Issues
```bash
# Check container status
docker-compose ps

# View logs
npm run docker:logs

# Rebuild containers
docker-compose up --build
```

### Database Issues
```bash
# Connect to MongoDB shell
docker-compose exec mongo mongosh il-buco-cleaners
```

### File Upload Issues
- Check `uploads/` directory permissions
- Verify nginx container is running
- Check NGINX_BASE_URL in environment