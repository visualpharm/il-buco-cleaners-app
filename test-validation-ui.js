const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testValidationUI() {
  console.log('Opening photo validation test page...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to test page
    await page.goto('http://localhost:3000/test-photo-validation.html');
    
    // Create a test image
    const testImagePath = path.join(__dirname, 'test-bedroom.jpg');
    const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(redPixelBase64, 'base64'));
    
    // Upload the image
    await page.setInputFiles('#photo', testImagePath);
    
    // Wait for validation
    await page.waitForSelector('#loading', { state: 'visible' });
    console.log('Validating photo...');
    
    // Wait for result
    await page.waitForSelector('#error.show, #result div', { timeout: 30000 });
    
    // Check if error is shown
    const errorVisible = await page.isVisible('#error.show');
    
    if (errorVisible) {
      const errorText = await page.textContent('#error-content');
      console.log('\n✓ Validation failed (as expected)');
      console.log('Error feedback:', errorText);
      
      // Take screenshot
      await page.screenshot({ path: 'validation-error-feedback.png' });
      console.log('Screenshot saved as validation-error-feedback.png');
      
      // Check for specific feedback format
      if (errorText.includes('Falta:')) {
        console.log('✓ Found "Falta:" prefix');
      }
      if (errorText.includes('→')) {
        console.log('✓ Found arrow instruction');
      }
    } else {
      console.log('Photo was validated successfully (unexpected)');
    }
    
    // Keep browser open for manual inspection
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

testValidationUI().catch(console.error);