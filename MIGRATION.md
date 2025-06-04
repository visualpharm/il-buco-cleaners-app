# Database Migration: Spanish to English Field Names

## Overview

This migration converts all Spanish database field names and collection names to English while maintaining the Spanish UI for users. This improves code maintainability and follows international development standards.

## What Changed

### Database Collections
- ✅ **checklistProgress**: Already in English (no change needed)
- ✅ **cleaningSessions**: Already in English (no change needed)
- ✅ **photos**: Already in English (no change needed)
- ✅ **clickEvents**: Already in English (no change needed)

### Database Field Names

#### Main Document Fields
| Spanish (Old) | English (New) | Description |
|---------------|---------------|-------------|
| `habitacion` | `room` | Room name |
| `tipo` | `type` | Room type |
| `horaInicio` | `startTime` | Start time |
| `horaFin` | `endTime` | End time |
| `pasos` | `steps` | Steps array |
| `sesionId` | `sessionId` | Session ID |
| `completa` | `complete` | Completion status |
| `fallado` | `failed` | Failure status |
| `fotoFalla` | `failurePhoto` | Failure photo URL |

#### Step Fields (within steps array)
| Spanish (Old) | English (New) | Description |
|---------------|---------------|-------------|
| `horaInicio` | `startTime` | Step start time |
| `horaCompletado` | `completedTime` | Step completion time |
| `tiempoTranscurrido` | `elapsedTime` | Elapsed time in ms |
| `foto` | `photo` | Photo URL |
| `validacionIA` | `validationAI` | AI validation object |
| `esValida` | `isValid` | Validation result |
| `analisis` | `analysis` | Analysis object |
| `esperaba` | `expected` | Expected result |
| `encontro` | `found` | Found result |
| `corregido` | `corrected` | Correction status |
| `ignorado` | `ignored` | Ignored status |
| `tipoFoto` | `photoType` | Photo type |
| `fallado` | `failed` | Step failure status |
| `fotoFalla` | `failurePhoto` | Step failure photo |

### API Endpoints

#### New Endpoints
- **`/api/cleanings`**: New endpoint with English field names
- Uses English field names in database operations
- Returns English field names in response

#### Backward Compatibility
- **`/api/limpiezas`**: Maintained for backward compatibility
- Internally calls `/api/cleanings` and transforms field names
- Returns Spanish field names to existing clients

#### Updated Endpoints
- **`/api/vanish`**: Updated to use English database fields
- Still returns Spanish field names for UI compatibility
- **`/api/checklist-progress`**: Updated to transform Spanish input to English database fields

## Migration Process

### 1. Migration Script
- **Location**: `scripts/migrate-to-english.js`
- **Features**:
  - Dry-run mode for testing
  - Batch processing for large datasets
  - Automatic backup creation
  - Index creation on new collections
  - Validation of migration results

### 2. Deployment Integration
- **prebuild**: Runs migration before building the application
- **postinstall**: Runs migration after npm install
- **Docker**: Attempts migration during container build

### 3. Field Mapping
```javascript
const FIELD_MAPPINGS = {
  habitacion: 'room',
  tipo: 'type',
  horaInicio: 'startTime',
  horaFin: 'endTime',
  pasos: 'steps',
  // ... complete mapping in migration script
};
```

## Running the Migration

### Manual Migration
```bash
# Dry run (test without changes)
npm run migrate:dry-run

# Apply migration
npm run migrate:apply
```

### Automatic Migration
- Runs automatically during:
  - `npm install` (development)
  - `npm run build` (deployment)
  - Docker container build

### Migration Safety
- ✅ Creates backup collections before migration
- ✅ Validates migration results
- ✅ Fails gracefully if database is unavailable
- ✅ Idempotent (safe to run multiple times)

## User Interface

### Spanish UI Maintained
The user interface remains completely in Spanish:
- All UI text, labels, and messages stay in Spanish
- Form fields use Spanish labels
- Error messages in Spanish
- Date/time formatting in Spanish locale

### API Transformation Layer
```typescript
// Database (English) → UI (Spanish)
{
  room: "Garden Room",           // Database
  startTime: "2025-01-01T10:00:00Z"
}
// Transformed to:
{
  habitacion: "Garden Room",     // UI
  horaInicio: "2025-01-01T10:00:00Z"
}
```

## Benefits

### For Developers
- ✅ **Standardized field names** in English
- ✅ **Better code readability** for international developers
- ✅ **Consistent naming conventions**
- ✅ **Easier API documentation**

### For Users
- ✅ **No UI changes** - everything stays in Spanish
- ✅ **Same functionality** - no breaking changes
- ✅ **Backward compatibility** maintained

### For Deployment
- ✅ **Automatic migration** during deployment
- ✅ **Zero-downtime** migration process
- ✅ **Rollback safety** with automatic backups

## Validation

After migration, verify:

1. **Database structure**:
   ```bash
   # Check field names are in English
   docker-compose exec mongo mongosh il-buco-cleaners --eval "db.checklistProgress.findOne()"
   ```

2. **API responses**:
   ```bash
   # New endpoint (English fields)
   curl http://localhost:3000/api/cleanings | jq '.[0] | keys'
   
   # Backward compatibility (Spanish fields)
   curl http://localhost:3000/api/limpiezas | jq '.[0] | keys'
   ```

3. **UI functionality**:
   - Visit `/vanish` page and verify data displays correctly
   - Create new cleaning sessions and verify they save properly
   - Check that photos and validation still work

## Troubleshooting

### Migration Issues
- **Connection refused**: Database not available during build (normal in CI/CD)
- **Duplicate key errors**: Migration already applied (safe to ignore)
- **Field not found**: Check field mapping in migration script

### API Issues
- **404 on /api/cleanings**: Migration script not run
- **Wrong field names**: Check transformation layer in API routes
- **UI not loading data**: Verify Spanish field mapping in components

## Next Steps

1. **Monitor** migration in production
2. **Remove** old API endpoints after confirmation (planned for future release)
3. **Update** documentation to reflect new database schema
4. **Consider** removing Spanish transformation layer once all clients updated