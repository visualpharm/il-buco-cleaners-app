const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhotoUpload() {
  console.log('Starting photo upload test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for debugging
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('Navigating to http://localhost:3002...');
    await page.goto('http://localhost:3002');
    
    // Check if profile selection is needed
    try {
      await page.waitForSelector('text=Selecciona tu perfil', { timeout: 3000 });
      console.log('Selecting Ivan profile...');
      await page.click('text=Ivan');
    } catch (e) {
      console.log('Profile already selected or not needed');
    }
    
    // Wait for room selection (check both possible texts)
    console.log('Waiting for room selection page...');
    try {
      await page.waitForSelector('text=Selecciona la habitación', { timeout: 5000 });
    } catch (e) {
      // Try alternative text
      await page.waitForSelector('text=Gracias por limpiar Il Buco', { timeout: 5000 });
    }
    
    // Click on Giardino
    console.log('Clicking on Giardino room...');
    await page.click('text=Giardino');
    
    // Navigate through steps to reach photo step
    console.log('Navigating to photo step...');
    for (let i = 0; i < 4; i++) {
      try {
        await page.waitForSelector('button:has-text("Continuar")', { timeout: 2000 });
        await page.click('button:has-text("Continuar")');
        console.log(`Completed step ${i + 1}`);
      } catch (e) {
        console.log(`Step ${i + 1} might not have Continue button`);
      }
    }
    
    // Look for photo upload area
    console.log('Looking for photo upload area...');
    await page.waitForSelector('text=Cama Completa', { timeout: 5000 });
    
    // Create a test image if it doesn't exist
    const testImagePath = path.join(__dirname, 'test-bed.jpg');
    if (!fs.existsSync(testImagePath)) {
      // Create a simple red pixel image
      const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      fs.writeFileSync(testImagePath, Buffer.from(redPixelBase64, 'base64'));
      console.log('Created test image');
    }
    
    // Upload the image
    console.log('Uploading test image...');
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for AI validation
    console.log('Waiting for AI validation...');
    await page.waitForSelector('text=Analizando foto con IA', { timeout: 5000 });
    
    // Wait for result (either success or error)
    console.log('Waiting for validation result...');
    await page.waitForSelector('.bg-red-100, .bg-green-100', { timeout: 30000 });
    
    // Check if we got an error
    const errorBox = await page.locator('.bg-red-100').first();
    const isError = await errorBox.isVisible();
    
    if (isError) {
      console.log('Photo validation failed (as expected for test image)');
      const errorText = await errorBox.textContent();
      console.log('Error feedback:', errorText);
      
      // Verify the error has specific feedback
      if (errorText.includes('Falta:')) {
        console.log('✓ Specific feedback found!');
      } else {
        console.log('✗ No specific feedback found');
      }
      
      if (errorText.includes('→')) {
        console.log('✓ Action instruction found!');
      } else {
        console.log('✗ No action instruction found');
      }
    } else {
      console.log('Photo validation passed (unexpected for test image)');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'photo-validation-result.png', fullPage: true });
    console.log('Screenshot saved as photo-validation-result.png');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testPhotoUpload().catch(console.error);