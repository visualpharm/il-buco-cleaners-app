const { chromium } = require('playwright');
const path = require('path');

async function testFullCleaningFlow() {
  console.log('Testing full cleaning flow with photo validation...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Go directly to main page with cleaner selected
    await page.goto('http://localhost:3000/?cleaner=ivan');
    console.log('1. Main page loaded with Ivan profile');
    
    // 2. Wait for room selection page
    await page.waitForSelector('text=Giardino');
    console.log('2. Room selection page loaded');
    
    // 3. Click on Giardino room
    await page.click('text=Giardino');
    console.log('3. Selected Giardino room');
    
    // 4. Complete steps until we reach photo requirement
    let stepCount = 0;
    while (stepCount < 10) {
      // Check if we see photo requirement
      if (await page.isVisible('text=Cama completa')) {
        console.log(`5. Photo requirement found at step ${stepCount + 1}`);
        
        // Upload the test image
        await page.setInputFiles('input[type="file"]', path.join(__dirname, 'test-bedroom-partial.png'));
        console.log('6. Uploaded test image');
        
        // Wait for validation
        await page.waitForSelector('text=Intento 1 de 2', { timeout: 10000 });
        console.log('7. Validation failed - showing attempt counter');
        
        // Check feedback content
        const feedbackElement = await page.waitForSelector('.text-red-800 .font-semibold');
        const feedbackText = await feedbackElement.textContent();
        console.log('8. AI Feedback displayed:', feedbackText);
        
        // Check if action instruction is shown
        const actionElement = await page.$('.text-red-700');
        if (actionElement) {
          const actionText = await actionElement.textContent();
          console.log('9. Action instruction:', actionText);
        }
        
        // Take screenshot of error state
        await page.screenshot({ path: 'test-validation-error-state.png' });
        console.log('10. Screenshot saved: test-validation-error-state.png');
        
        console.log('\n✅ TEST PASSED: Specific feedback is displayed in the pink error bar');
        console.log(`✅ Feedback shows: "${feedbackText}"`);
        
        break;
      }
      
      // Complete current step
      if (await page.isVisible('button:has-text("Completar")')) {
        await page.click('button:has-text("Completar")');
        stepCount++;
      } else {
        console.log('No complete button found, checking for other actions...');
        break;
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error-state.png' });
  } finally {
    console.log('\nKeeping browser open for manual inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

testFullCleaningFlow().catch(console.error);