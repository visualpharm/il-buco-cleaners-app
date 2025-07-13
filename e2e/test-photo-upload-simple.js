const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhotoUpload() {
  console.log('Starting photo upload test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('Navigating to http://localhost:3002...');
    await page.goto('http://localhost:3002');
    
    // Take screenshot to see what's on the page
    await page.screenshot({ path: 'test-initial-page.png' });
    console.log('Initial page screenshot saved');
    
    // Wait a bit for page to load
    await page.waitForTimeout(2000);
    
    // Check if we need to select a profile
    const profileText = await page.locator('text=Selecciona tu perfil').count();
    if (profileText > 0) {
      console.log('Found profile selection page');
      await page.click('text=Ivan');
      await page.waitForTimeout(1000);
    }
    
    // Check for room selection
    const roomsVisible = await page.locator('text=Giardino').count();
    if (roomsVisible > 0) {
      console.log('Found Giardino room, clicking...');
      await page.click('text=Giardino');
      await page.waitForTimeout(1000);
    }
    
    // Navigate through steps to find photo step
    console.log('Looking for photo upload step...');
    for (let i = 0; i < 10; i++) {
      // Check if we have photo upload area
      const photoAreaCount = await page.locator('text=Toca para tomar la foto').count();
      if (photoAreaCount > 0) {
        console.log(`Found photo upload area at step ${i + 1}`);
        break;
      }
      
      // Try to click Continue button
      const continueBtn = await page.locator('button:has-text("Continuar")').count();
      if (continueBtn > 0) {
        await page.click('button:has-text("Continuar")');
        console.log(`Clicked continue at step ${i + 1}`);
        await page.waitForTimeout(1000);
      } else {
        console.log(`No continue button at step ${i + 1}`);
      }
    }
    
    // Take screenshot before upload
    await page.screenshot({ path: 'test-before-upload.png' });
    console.log('Before upload screenshot saved');
    
    // Create test image
    const testImagePath = path.join(__dirname, 'test-bed-simple.jpg');
    const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(redPixelBase64, 'base64'));
    
    // Try to upload image
    const fileInputs = await page.locator('input[type="file"]').all();
    console.log(`Found ${fileInputs.length} file inputs`);
    
    if (fileInputs.length > 0) {
      await fileInputs[0].setInputFiles(testImagePath);
      console.log('File uploaded');
      
      // Wait for validation
      await page.waitForTimeout(3000);
      
      // Take screenshot after upload
      await page.screenshot({ path: 'test-after-upload.png' });
      console.log('After upload screenshot saved');
      
      // Check for error message
      const errorBox = await page.locator('.bg-red-100').count();
      if (errorBox > 0) {
        console.log('Found error box');
        const errorText = await page.locator('.bg-red-100').textContent();
        console.log('Error text:', errorText);
        
        // Check for specific feedback
        if (errorText.includes('Falta:')) {
          console.log('✓ Found "Falta:" in error message');
        } else {
          console.log('✗ No "Falta:" found in error message');
        }
        
        if (errorText.includes('→')) {
          console.log('✓ Found arrow (→) in error message');
        } else {
          console.log('✗ No arrow found in error message');
        }
      } else {
        console.log('No error box found after upload');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    console.log('Test completed, keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testPhotoUpload().catch(console.error);