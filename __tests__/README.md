# Checklist Button Integration Tests

This directory contains automated integration tests for the checklist button feature, verifying that UI actions properly persist data to MongoDB.

## Test Files

### `checklist-button.integration.test.ts`
Tests the core database operations and API endpoints:
- Direct database save/update operations for checklist progress
- Step completion tracking with timestamps
- Photo validation and failure handling
- Spanish to English field conversion in the API layer

### `checklist-button-ui.integration.test.tsx`
Tests the actual UI component interactions:
- Clicking the "Completar" button saves progress to database
- Photo requirements prevent step completion until fulfilled
- Full checklist completion marks room as cleaned
- URL-based state persistence across page refreshes

## Running the Tests

### Prerequisites
- MongoDB must be running locally on port 27017
- Or use MongoDB Memory Server (automatically used in tests)

### Run all checklist tests:
```bash
npm run test:all-checklist
```

### Run specific test suites:
```bash
# Database operations only
npm run test:checklist-button

# UI interactions only
npm run test:checklist-ui

# All integration tests
npm run test:integration
```

### Run with coverage:
```bash
npm run test:coverage
```

### Run in watch mode:
```bash
npm run test:watch
```

## Test Configuration

### Environment Variables
You can configure test behavior with these environment variables:

```bash
# Use real MongoDB instead of in-memory server
USE_REAL_DB_FOR_TESTS=true npm test

# Keep test data after tests complete (useful for debugging)
DISABLE_TEST_DB_CLEANUP=true npm test
```

### What the Tests Verify

1. **Button Click → Database Save**
   - When user clicks "Completar", the step is marked as completed in MongoDB
   - Timestamp and elapsed time are recorded
   - Session ID is maintained across steps

2. **Photo Validation Flow**
   - Steps requiring photos show camera UI instead of complete button
   - Photo validation results are stored with the step
   - Failed validations can be corrected or ignored

3. **Room Completion**
   - All steps must be completed to mark room as cleaned
   - Cleaning session statistics are updated
   - Progress persists across page refreshes via URL parameters

4. **Field Mapping**
   - Spanish UI fields are correctly converted to English database fields
   - API transformation layer works bidirectionally

## Test Structure

Each test follows this pattern:
1. **Arrange**: Set up test data and mock responses
2. **Act**: Perform the user action (click button, upload photo, etc.)
3. **Assert**: Verify database contains expected data

## Debugging Failed Tests

If tests fail, check:
1. MongoDB connection (is MongoDB running?)
2. Port conflicts (is 27037 available for test DB?)
3. File permissions for upload directories
4. Mock responses match expected API structure

## CI/CD Integration

These tests are designed to run in CI pipelines:
- Use MongoDB Memory Server for isolated test database
- No external dependencies required
- Automatic cleanup after test completion
- Exit codes indicate pass/fail status

Add to your CI configuration:
```yaml
- name: Run Integration Tests
  run: npm run test:all-checklist
```