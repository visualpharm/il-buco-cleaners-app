# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Il Buco Cleaners is a comprehensive cleaning management system for an Airbnb property. The application features a step-by-step cleaning checklist with photo validation, session tracking, analytics, and failure reporting. The UI is maintained in Spanish while the database uses English field names for international code standards.


## Strict requirements for Claude
UI is in Spanish, but the collection names, document fields, variables are in English.

Data format is: Hoy, Ayer, Ene 12, Nov 12, 2024
Time format: 9:30, 12:50.

Cleaning session (cs) is all operations performed during a single day, if there are no breaks by 1 hour or more. If there are, these are 2 separate sessions in one day.

### Key stats
Key stats for the whole /vanish secion (ksv) are averages for the last 30 days: average cleaning session duration (defined as total dime / number of cleaning sessions), average time per room, average success rate (which is 100% - % of failed operations).

Key stats for a cleaning session (ksc) are: start time, duration, number of rooms/spaces cleaned, % of success (which is 100% - % of failed operations)

Key stats for a room/space (ksr) are the same as cleaning session except the number of spaces cleaned is replaced by the number of operations completed (either all or % of non-skipped and non-abandoned operations)

### Vanish tables
Vanish home: ksv stats on top. Then, each line contains ksc
Session: ksc on top. Then, each line contains ksr, then photos uploaded, then a button to mark failure and optionally take a picture.




## Development Commands

### Local Development
```bash
# Start development server with hot reload
npm run dev

# Docker development (recommended)
npm run docker:up --build    # Start all services with rebuild
npm run docker:down          # Stop all services
npm run docker:logs          # View container logs
```

### Database Migration
```bash
# Test migration without applying changes
npm run migrate:dry-run

# Apply migration to convert Spanish fields to English
npm run migrate:apply
```

### Build and Deployment
```bash
npm run build        # Builds app (production ready)
npm run setup-dirs   # Create required directories
npm run start        # Production server (runs setup + migration at startup)
npm run lint         # ESLint check

# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Serverless deployment (Vercel, Netlify)
# - Uses /tmp/uploads for file storage
# - Serves files via /api/files/[...path] route
# - Environment variables: VERCEL=1 auto-detected
```

## Architecture Overview

### Database Architecture
- **MongoDB** with dual-language field support
- **English field names** in database for international standards
- **Spanish UI field mapping** via API transformation layer
- **Automatic migration system** converts legacy Spanish fields to English

#### Key Collections:
- `checklistProgress` - Main cleaning workflow data with step-by-step tracking
- `cleaningSessions` - Basic session metadata
- `photos` - Image storage with session association
- `clickEvents` - User interaction analytics

### API Layer Structure
The application implements a **dual-language API strategy**:

#### Core APIs (English Database Fields):
- `/api/cleanings` - New standardized endpoint with English fields
- `/api/checklist-progress` - Transforms Spanish input to English database fields
- `/api/vanish` - Advanced cleaning operations with failure tracking

#### Backward Compatibility Layer:
- `/api/limpiezas` - Legacy endpoint that transforms English DB fields back to Spanish for existing clients

#### Field Transformation Pattern:
```typescript
// Spanish UI → English Database
{ habitacion: "Garden Room" } → { room: "Garden Room" }
{ horaInicio: "2025-01-01" } → { startTime: "2025-01-01" }
{ pasos: [...] } → { steps: [...] }
```

### Frontend Architecture

#### Room-Based Cleaning System:
The main page (`app/page.tsx`) implements a **dynamic checklist system**:
- **7 different room types** with specific cleaning workflows
- **3 checklist variations**: habitaciones (18 steps), parrilla (1 step), escalera (6 steps)
- **Photo validation system** with simulated AI analysis
- **Session persistence** across room cleaning workflows

#### Key Components:
- **Dynamic room selection** with floor-based organization
- **Step-by-step progress tracking** with timing
- **Photo requirement system** - randomly selects 1 of 3 photo types per session
- **Failure reporting** with photo documentation at both operation and step levels

#### State Management Pattern:
```typescript
// Session state tracks multiple rooms
interface SesionLimpieza {
  id: string
  horaInicio: Date
  fotosSeleccionadas: string[]  // Random photo requirements
  fotosPedidas: string[]        // Photos already taken
  habitacionesLimpiadas: string[] // Completed rooms
}
```

### File Upload & Storage
The application uses **environment-aware file storage**:

#### Traditional Deployments (Docker):
- **Local filesystem storage** in `./uploads` directory
- **Nginx serving** static files via reverse proxy at `/uploads/*`
- **Persistent storage** with volume mounting

#### Serverless Deployments (Vercel, Netlify):
- **Temporary storage** in `/tmp/uploads` directory
- **API route serving** files via `/api/files/[...path]`
- **Automatic environment detection** via VERCEL/NETLIFY env vars

#### Common Features:
- **Session-based organization** (`general/` and `sessions/sessionId/`)
- **Photo validation integration** with cleaning steps
- **Automatic directory creation** during startup

### Analytics System
- **Click tracking** via global `ClickTracker` component
- **User behavior analytics** with browser fingerprinting
- **Session statistics** with duration and completion tracking
- **Advanced reporting** in `/vanish` page with date-based filtering

## Important Development Notes

### Database Field Naming
- **Always use English field names** when working with database operations
- **Database interfaces** in `lib/database.ts` use English fields
- **API transformation** happens automatically for Spanish UI compatibility
- **Migration system** runs automatically during deployment

### UI Language Consistency
- **Keep all UI text in Spanish** - this is a Spanish-language application
- **Error messages** should be in Spanish for user-facing components
- **Form labels and validation** messages stay in Spanish
- **Comments in code** can be in English

### Photo Validation System
The app includes a **simulated AI validation system**:
- **Mock validation** with 60% success rate in `validarFotoConIA()`
- **Detailed analysis responses** with expected vs found descriptions
- **Correction workflow** allowing re-take or ignore validation failures
- **Integration with cleaning steps** via `TIPOS_FOTOS` configuration

### Session Management
- **Cross-room sessions** where one session can span multiple room cleanings
- **Photo requirements** are selected per session, not per room
- **Automatic session detection** based on timing gaps (>1 hour creates new session)
- **Backup strategies** using both MongoDB and localStorage

### Hot Reload Configuration
The project is configured for **immediate code reflection** during Docker development:
- **File polling enabled** with `WATCHPACK_POLLING=true`
- **Volume mounting** excludes `node_modules` and `.next`
- **Next.js webpack configuration** optimized for Docker file watching

### API Error Handling
- **Spanish error messages** for user-facing APIs
- **Graceful degradation** when database is unavailable
- **Automatic retry logic** in migration scripts
- **Development vs production** error detail levels

### Testing Database Operations
```bash
# Connect to MongoDB container
docker-compose exec mongo mongosh il-buco-cleaners

# Check collections
show collections

# Verify field structure after migration
db.checklistProgress.findOne()
```

This architecture supports a robust cleaning management system with international code standards while maintaining a localized Spanish user experience.