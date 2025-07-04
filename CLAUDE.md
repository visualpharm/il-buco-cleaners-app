# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Il Buco Cleaners is a comprehensive cleaning management system for an Airbnb property. The application features a step-by-step cleaning checklist with photo validation, session tracking, analytics, and failure reporting. The UI is maintained in Spanish while the database uses English field names for international code standards.


## Strict requirements for Claude
UI is in Spanish, but the collection names, document fields, variables are in English.

Data format is: Hoy, Ayer, Ene 12, Nov 12, 2024
Time format: 9:30, 12:50.

Cleaning session (cs) is all operations performed during a single day, if there are no breaks by 1 hour or more. If there are, these are 2 separate sessions in one day.

We don't ask for confirmations, but we allow to revert the operations, always if it's less than a page of the extra code. 

if we show thumbnails of the photos somewhere, they should be 30x30px, 60x60px, or 120x120px (whatever suits better the encapsulating div) and on click opened with fancy zoom or similar library, and could be viewed as a gallery, with left-right buttons, space, etc.

### Development Notes

#### Photo Upload Issues
If photo uploads fail with "Error al subir la foto", ensure `UPLOADS_DIR="./uploads"` is set in `.env.development.local` to override Vercel environment detection that can interfere with local file storage.

### Key stats
Key stats for the whole /vanish secion (ksv) are averages for the last 30 days: average cleaning session duration (defined as total dime / number of cleaning sessions), average time per room, average success rate (which is 100% - % of failed operations).

Key stats for a cleaning session (ksc) are: start time, duration, number of rooms/spaces cleaned, % of success (which is 100% - % of failed operations)

Key stats for a room/space (ksr) are the same as cleaning session except the number of spaces cleaned is replaced by the number of operations completed (either all or % of non-skipped and non-abandoned operations)

### Vanish tables
Vanish home: ksv stats on top. Then, each line contains ksc
Session: ksc on top. Then, each line contains ksr, then photos uploaded, then a button to mark failure and optionally take a picture.

## UI Implementation Details

### Vanish Analytics UI (`/app/vanish/page.tsx`)
The vanish page provides comprehensive cleaning analytics with three view levels:

#### Main Sessions List View:
- **KSV Stats Cards**: 30-day averages (session duration, time per room, success rate)
- **Sessions Table**: Sortable columns (start time, duration, room count, success rate), photo thumbnails
- **Gallery Integration**: Click thumbnails to open full-screen gallery with keyboard navigation

#### Session Detail View (`?session=sessionId`):
- **KSC Stats Cards**: Start time, duration, rooms cleaned, success rate for this session
- **Room Operations Table**: Each row shows room details, duration, progress, photos, failure button
- **Failure Management**: Toggle failure state, upload/remove failure photos with camera/X buttons

#### Operation Detail View (`?session=sessionId&operation=operationId`):
- **KSR Stats Cards**: Room name, duration, steps completed, success rate for this operation
- **Step Details Table**: Shows each step with title (cropped at colon), timing, duration, status, photos, failure button
- **Step-Level Failure Tracking**: Mark individual steps as failed

#### Key UI Patterns:
- **URL-based navigation**: All views are shareable/refreshable via URL parameters
- **Photo separation**: Cleaner photos vs failure photos (thumbnails show only cleaner photos, gallery shows all)
- **Photo previews**: 30x30px thumbnails with hover effects, red border for failure photos
- **Failure button states**: Black/white inversion when failed, gray when processing
- **Gallery controls**: ESC/Arrow keys/Space, photo counter, navigation buttons

### Cleaner's UI (`/app/page.tsx`)
The main cleaning interface with room selection and step-by-step workflow:

#### Room Selection View:
- **Floor-based grouping**: Planta Baja (blue), 1er Piso (orange), 2do Piso (pink), Común (gray)
- **Room cards**: Icon, name, completion checkmark, disabled state for Penthouse
- **Session tracking**: Visual indicators for already cleaned rooms

#### Cleaning Workflow View:
- **URL persistence**: Current room, step, session tracked in URL for refreshability
- **Progress bar**: Visual step completion indicator
- **Step display**: Category badge, formatted title with bullet lists for complex steps
- **Photo requirements**: Contextual camera prompts with descriptions
- **AI validation**: Mock validation with 60% failure rate, correction workflow
- **Navigation**: Back button, step counter, room/floor context

#### Key Features:
- **Dynamic checklists**: Different steps per room type (habitaciones: 18 steps, parrilla: 1 step, escalera: 3 steps)
- **Photo validation flow**: Take photo → AI analysis → correction prompts → proceed
- **Session continuity**: Cross-room sessions with photo requirements selected per session
- **State restoration**: URL-based state recovery for interrupted sessions

### Step Title Helper Function:
```typescript
const getStepTitle = (stepId: number, roomType?: string): string => {
  const checklist = obtenerChecklist(roomType || "")
  const step = checklist.find(s => s.id === stepId)
  if (!step) return `Paso ${stepId}`
  
  // Crop title at the colon if it exists
  const colonIndex = step.texto.indexOf(':')
  return colonIndex !== -1 ? step.texto.substring(0, colonIndex) : step.texto
}
```

### Photo Management:
- **Upload endpoint**: `/api/upload-image` accepts 'file' form field
- **Storage paths**: `general/` for failure photos, `sessions/sessionId/` for step photos
- **URL format**: `/uploads/general/filename.jpg` or `/uploads/sessions/sessionId/filename.jpg`
- **Separation logic**: `getOperationCleanerPhotos()` vs `getOperationPhotos()` for display vs gallery




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



## Add automated test for checklist button with DB verification

Please add an automated integration test for the checklist button feature with the following requirements:

- Simulate a user clicking the checklist button in the UI.
- After the click, verify the change is correctly stored in the MongoDB database.
- Use the existing MongoDB connection from `lib/mongodb.ts`.
- The test should:
  - Trigger the checklist item toggle or update operation.
  - Query the relevant MongoDB collection to confirm the updated checklist state.
  - Assert that the database reflects the UI action accurately.
- The test should run automatically as part of the build/test pipeline.
- Write the test using the current testing framework (e.g., Jest, Testing Library).
- Include any necessary setup and teardown logic for database state isolation.
- Provide clear logs or error messages if the test fails.

Please create the test file in the appropriate `tests` or `__tests__` folder and ensure it integrates with existing CI/test runs.

---

If you want, I can draft a full example test code for this based on your current stack and collections. Let me know.

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

# Multi-user experience. 
Opening the Cleaners app, we can see different users, pretty much like in the Netflix first screen. The users are Ivan, Andres, Melody, and these users are stored in the file. So, the user chooses his profile and there is no password. 

The dashboard, in the Vanish section, it shows the cleaner tab in all the tables and it shows the filters, so you can filter by certain user, by certain cleaner. The Vanish remembers the last cleaner we filtered for. Basically, it stores the state of the filters of the period and of the cle Create a multi-cleaner experience according to Claude.md. aner we filtered to. When a cleaner sees the list of the rooms, the room only sees the rooms that are completed by this cleaner, but not by other ones. Also, this checkmark that appears at the room when it's done must be much bigger. When a cleaner sees the list of the rooms, the room only sees the rooms that are completed by this cleaner, but not by other ones. Also, this checkmark that appears at the room when it's done must be much bigger and very notable. So, the cleaner is proud of what he's done. 

