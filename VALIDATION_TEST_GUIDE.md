# Photo Validation Test Guide

## New Features to Test

### 1. Validation Attempts Counter
- When a photo fails validation, you should see "Intento 1 de 2" in the error message
- After retrying and failing again, you should see "Intento 2 de 2"
- After the 2nd failed attempt, the photo should be automatically accepted with message "Foto aceptada para revisión posterior"

### 2. Skip Button
- The skip button now says "No puedo cumplir con este requisito"
- When clicked, it marks the step as "skipped" in the database
- The cleaner can continue to the next step

### 3. Database Tracking
The system now tracks:
- `validationAttempts`: Number of validation attempts (max 2)
- `validationStatus`: One of 'passed', 'failed_after_retries', 'skipped', 'pending'

## Test Steps

1. **Test Normal Flow**:
   - Go to the cleaners app
   - Select a room (e.g., Giardino)
   - Navigate to a step that requires a photo
   - Upload a photo that will fail validation
   - Verify you see "Intento 1 de 2"

2. **Test Second Attempt**:
   - Click "Ya corregí. Sacar otra foto"
   - Upload another photo (can be the same)
   - If it fails again, verify you see "Intento 2 de 2"
   - After this, the photo should be auto-accepted

3. **Test Skip Button**:
   - On any validation failure, click "No puedo cumplir con este requisito"
   - Verify you can continue to the next step
   - Check the database to confirm it's marked as "skipped"

## Expected Database Entry

After testing, check MongoDB for the step data:
```javascript
{
  validationAttempts: 2,
  validationStatus: "failed_after_retries", // or "skipped" if skip button used
  validationAI: {
    isValid: true, // auto-accepted after 2 attempts
    autoAccepted: true,
    analysis: {
      expected: "Foto aceptada para revisión posterior",
      found: "Falló validación después de 2 intentos"
    }
  }
}
```