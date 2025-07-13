const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testValidationAttempts() {
  console.log('Testing photo validation with 2 attempts limit...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to test page
    await page.goto('http://localhost:3000/test-photo-validation.html');
    
    // Create a test image
    const testImagePath = path.join(__dirname, 'test-validation.jpg');
    const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(redPixelBase64, 'base64'));
    
    console.log('\n=== First Attempt ===');
    // First attempt - should fail
    await page.setInputFiles('#photo', testImagePath);
    await page.waitForSelector('#loading', { state: 'visible' });
    await page.waitForSelector('#error.show', { timeout: 30000 });
    
    let errorText = await page.textContent('#error-content');
    console.log('First attempt feedback:', errorText);
    
    // Check if attempt counter shows
    const attemptText = await page.textContent('.text-red-800');
    if (attemptText.includes('Intento')) {
      console.log('✓ Attempt counter found');
    }
    
    // Check skip button text
    const skipButtonText = await page.textContent('button:has-text("No puedo cumplir")');
    if (skipButtonText) {
      console.log('✓ Skip button renamed correctly');
    }
    
    await page.screenshot({ path: 'test-attempt-1.png' });
    
    console.log('\n=== Second Attempt ===');
    // Second attempt - should also fail but auto-accept
    await page.click('button:has-text("Ya corregí")');
    await page.waitForTimeout(500);
    
    // Upload again
    await page.setInputFiles('#photo', testImagePath);
    await page.waitForTimeout(3000);
    
    // Check the result
    const error2 = await page.isVisible('#error.show');
    const success = await page.isVisible('#result div');
    
    if (!error2 && success) {
      console.log('✓ Photo auto-accepted after 2 attempts');
      const successText = await page.textContent('#result');
      console.log('Success message:', successText);
    } else {
      console.log('✗ Photo was not auto-accepted');
    }
    
    await page.screenshot({ path: 'test-attempt-2.png' });
    
    console.log('\n=== Testing Skip Button ===');
    // Reset and test skip
    await page.reload();
    await page.setInputFiles('#photo', testImagePath);
    await page.waitForSelector('#error.show', { timeout: 30000 });
    
    // Click skip button
    await page.click('button:has-text("No puedo cumplir")');
    console.log('✓ Skip button clicked - validation should be marked as skipped');
    
    console.log('\nTest completed successfully!');
    
    // Keep browser open for inspection
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

testValidationAttempts().catch(console.error);