import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Photo Validation', () => {
  test('should show specific AI feedback when photo validation fails', async ({ page }) => {
    // Start the app
    await page.goto('http://localhost:3000');
    
    // Check if we need to select a cleaner profile
    try {
      await page.waitForSelector('text=Selecciona tu perfil', { timeout: 3000 });
      await page.click('text=Ivan'); // Select Ivan as cleaner
    } catch (e) {
      // Profile might already be selected
      console.log('Profile selection not needed');
    }
    
    // Wait for room selection page
    await page.waitForSelector('text=Selecciona la habitación o área a limpiar');
    
    // Click on Giardino room
    await page.click('text=Giardino');
    
    // Wait for the cleaning checklist to load
    await page.waitForSelector('text=Tender la cama');
    
    // Navigate to step 5 which requires a photo (based on the screenshot)
    for (let i = 0; i < 4; i++) {
      await page.click('button:has-text("Continuar")');
      await page.waitForTimeout(500); // Small delay between steps
    }
    
    // Wait for photo requirement to appear
    await page.waitForSelector('text=Cama Completa');
    
    // Upload test image
    const fileInput = await page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, 'fixtures', 'test-bed.png');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for AI validation
    await page.waitForSelector('text=Analizando foto con IA...', { timeout: 5000 });
    
    // Wait for validation result
    await page.waitForSelector('.bg-red-100', { timeout: 30000 }); // Red error box
    
    // Check for specific feedback
    const errorBox = await page.locator('.bg-red-100');
    const errorText = await errorBox.textContent();
    
    console.log('Error feedback received:', errorText);
    
    // Verify we get specific feedback (not generic message)
    expect(errorText).not.toContain('La foto no cumple con los requisitos esperados');
    
    // Should contain "Falta:" indicating what's missing
    expect(errorText).toMatch(/Falta:/);
    
    // Should contain action instruction with arrow
    expect(errorText).toMatch(/→/);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/photo-validation-error.png', fullPage: true });
    
    // Test the "Ya corregí. Sacar otra foto" button
    const retryButton = await page.locator('button:has-text("Ya corregí. Sacar otra foto")');
    expect(retryButton).toBeVisible();
    
    // Click the retry button and verify it opens file dialog
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      retryButton.click()
    ]);
    
    expect(fileChooser).toBeTruthy();
  });
});

test.beforeAll(async () => {
  console.log('Starting test server...');
  // Make sure dev server is running
});