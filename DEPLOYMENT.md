# Deployment Guide

## Overview

This application uses an **improved deployment strategy** that separates build-time and runtime concerns for reliable production deployments.

## Deployment Strategy

### ✅ **Fixed Issues**
- **No migration during Docker build** - Database isn't available during CI/CD builds
- **Single migration trigger** - Only runs at application startup
- **Consistent package manager** - Uses pnpm throughout
- **Proper error handling** - Graceful degradation when DB unavailable
- **Production-ready configuration** - Optimized for real deployment scenarios

### 🏗️ **Build Phase** (No Database Required)
```dockerfile
# Dockerfile handles:
1. Install dependencies (pnpm install)
2. Copy source code
3. Build application (pnpm run build)
4. Create production image
```

### 🚀 **Runtime Phase** (Database Available)
```bash
# When container starts:
1. prestart hook runs startup-migration.js
2. Migration connects to live database
3. Schema updated if needed
4. Application starts with pnpm run start
```

## Deployment Commands

### Development
```bash
# Local development with hot reload
npm run docker:up

# Stop development environment
npm run docker:down
```

### Production
```bash
# Build and start production containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Or build production image
docker build -t il-buco-cleaners .
docker run -e MONGODB_URI=your_mongo_url il-buco-cleaners
```

### Manual Migration
```bash
# Test migration without applying changes
npm run migrate:dry-run

# Apply migration manually
npm run migrate:apply
```

## Production Checklist

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV=production` - Enable production optimizations
- `UPLOADS_DIR` - Directory for uploaded files

### Database Requirements
- MongoDB instance accessible from application
- Network connectivity between app and database
- Proper authentication/authorization configured

### Container Orchestration
```yaml
# Example Kubernetes deployment
spec:
  containers:
  - name: il-buco-cleaners
    image: il-buco-cleaners:latest
    env:
    - name: MONGODB_URI
      valueFrom:
        secretKeyRef:
          name: mongo-secret
          key: uri
    - name: NODE_ENV
      value: "production"
```

## Migration Safety

### Idempotent Operations
- ✅ Safe to run multiple times
- ✅ Checks existing schema before changes
- ✅ Creates backups automatically
- ✅ Validates migration success

### Error Handling
```javascript
// startup-migration.js behavior:
- Database unavailable → App starts, logs warning
- Network timeout → App starts, retry on next restart  
- Migration conflicts → App fails to start (manual intervention)
- Schema corruption → App fails to start (manual intervention)
```

## Monitoring

### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/test-db

# Check migration status
docker logs container_name | grep migration
```

### Common Issues
1. **Migration timeout** - Increase database connection timeout
2. **Permission errors** - Check MongoDB authentication
3. **Network issues** - Verify container networking
4. **Schema conflicts** - Run manual migration with dry-run first

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy
jobs:
  deploy:
    steps:
    - name: Build Image
      run: docker build -t il-buco-cleaners .
    
    - name: Deploy to Production  
      run: |
        # Migration runs automatically at startup
        docker run -d \
          -e MONGODB_URI=${{ secrets.MONGODB_URI }} \
          -e NODE_ENV=production \
          il-buco-cleaners
```

### Deployment Verification
```bash
# After deployment, verify:
1. Application responds: curl http://your-app/api/test-db
2. Migration completed: check logs for "✅ Startup migration completed"
3. Database schema: verify collections use English field names
4. UI functionality: test cleaning workflow
```

This deployment strategy ensures reliable, production-ready deployments with proper separation of build and runtime concerns.