# File Upload Troubleshooting Guide

## Fixed Issues

### ✅ **"ENOENT: no such file or directory, mkdir './uploads'"**

**Problem**: Application trying to create uploads directory but failing due to:
- Missing directory in deployment environment
- Incorrect permissions
- Serverless environment limitations (Vercel read-only filesystem)

**Solution Applied**:
1. **Added setup-directories.js script** that runs before app startup
2. **Environment-aware storage** that detects serverless environments
3. **API route for file serving** in serverless environments

## Error Types & Solutions

### 1. Directory Creation Errors

#### Symptoms:
```
ENOENT: no such file or directory, mkdir './uploads'
Upload failed: Error: Upload failed (ENOENT...)
```

#### Solutions:
```bash
# Manual directory setup
npm run setup-dirs

# Check directory permissions
ls -la ./uploads

# Verify environment variables
echo $UPLOADS_DIR
```

### 2. Vercel/Serverless Issues

#### Symptoms:
- Files upload but aren't accessible via URL
- 404 errors when loading images
- Files disappear after deployment

#### Solutions:
- ✅ **Automatic detection**: App detects `VERCEL=1` environment variable
- ✅ **Uses /tmp/uploads**: Only writable directory in serverless
- ✅ **API route serving**: Files served via `/api/files/[...path]`

### 3. Console Errors (Non-Critical)

#### Sentry Browser Extension Error:
```
[Sentry] You cannot run Sentry this way in a browser extension
```
**Status**: ❌ **Not an app issue** - Browser extension conflict
**Action**: Ignore - doesn't affect functionality

#### React DevTools Warning:
```
Download the React DevTools for a better development experience
```
**Status**: ❌ **Not an app issue** - Development suggestion
**Action**: Ignore - doesn't affect functionality

## Environment Configuration

### Traditional Deployment (Docker)
```yaml
environment:
  - UPLOADS_DIR=./uploads
  - NGINX_BASE_URL=http://localhost:8080
```

### Serverless Deployment (Vercel)
```yaml
environment:
  - VERCEL=1  # Auto-detected
  - UPLOADS_DIR=/tmp/uploads  # Auto-set
```

## File Storage Paths

### Development:
- **Directory**: `./uploads/`
- **URL**: `http://localhost:8080/uploads/[subfolder]/[filename]`

### Docker Production:
- **Directory**: `./uploads/` (volume mounted)
- **URL**: `http://nginx:80/uploads/[subfolder]/[filename]`

### Vercel Production:
- **Directory**: `/tmp/uploads/` (temporary)
- **URL**: `https://your-app.vercel.app/api/files/[subfolder]/[filename]`

## Verification Commands

### Check Directory Structure:
```bash
# Local development
ls -la ./uploads/
ls -la ./uploads/general/
ls -la ./uploads/sessions/

# Docker container
docker exec container_name ls -la /app/uploads/

# Serverless (check logs)
# Directories created at runtime in /tmp/uploads
```

### Test Upload API:
```bash
# Test upload endpoint
curl -X POST \
  -F "file=@test-image.jpg" \
  http://localhost:3000/api/upload-image

# Expected response:
# {"url":"http://localhost:8080/uploads/general/uuid.jpg","filename":"uuid.jpg"}
```

### Test File Access:
```bash
# Traditional deployment
curl http://localhost:8080/uploads/general/filename.jpg

# Serverless deployment  
curl http://localhost:3000/api/files/general/filename.jpg
```

## Common Deployment Issues

### 1. **Missing Environment Variables**
```bash
# Required for Docker
NGINX_BASE_URL=http://localhost:8080

# Auto-detected for Vercel
VERCEL=1

# Custom uploads directory
UPLOADS_DIR=/custom/path
```

### 2. **Volume Mounting (Docker)**
```yaml
volumes:
  - ./uploads:/app/uploads  # Persistent storage
```

### 3. **File Permissions**
```bash
# Fix permissions in Docker
RUN chown -R node:node /app/uploads
USER node
```

## Monitoring & Debugging

### Application Logs:
```bash
# Look for these messages:
✓ Uploads directory exists: ./uploads
📁 Creating uploads directory: ./uploads
✅ Created uploads directory: ./uploads
❌ Failed to create uploads directory: ./uploads
```

### API Response Debugging:
```javascript
// In browser console during upload
console.log('Upload response:', response);
// Should show: {url: "...", filename: "..."}
```

## Future Improvements

### For Production:
1. **External Storage**: Consider AWS S3, Cloudinary for scalability
2. **CDN Integration**: Cache and serve files globally
3. **File Cleanup**: Automatic deletion of old temporary files

### For Serverless:
1. **Persistent Storage**: Database blob storage or external service
2. **Image Processing**: Serverless image optimization
3. **Background Cleanup**: Scheduled function to clean /tmp