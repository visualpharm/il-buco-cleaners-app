const { chromium } = require('playwright');
const path = require('path');

async function testRealAppScreenshot() {
  console.log('Testing real app with random screenshot...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Create a random screenshot first
    const testPage = await context.newPage();
    await testPage.goto('https://www.google.com');
    await testPage.screenshot({ path: 'test-google-screenshot.png' });
    await testPage.close();
    console.log('Created test screenshot of Google homepage');
    
    // Go to main app with cleaner
    await page.goto('http://localhost:3000/?cleaner=ivan');
    console.log('1. Main page loaded with Ivan profile');
    
    // Wait for and click Giardino
    await page.waitForSelector('text=Giardino');
    await page.click('text=Giardino');
    console.log('2. Selected Giardino room');
    
    // Complete steps until we reach photo requirement
    let stepCount = 0;
    while (stepCount < 10) {
      if (await page.isVisible('text=Cama completa')) {
        console.log(`3. Photo requirement found at step ${stepCount + 1}`);
        
        // Upload the Google screenshot
        await page.setInputFiles('input[type="file"]', path.join(__dirname, 'test-google-screenshot.png'));
        console.log('4. Uploaded Google screenshot');
        
        // Wait for result
        await page.waitForTimeout(5000); // Give it time to process
        
        // Check what happened
        if (await page.isVisible('text=Intento 1 de 2')) {
          console.log('✅ CORRECT: Validation failed as expected');
          const feedbackElement = await page.$('.text-red-800 .font-semibold');
          if (feedbackElement) {
            const feedback = await feedbackElement.textContent();
            console.log('Feedback:', feedback);
          }
        } else if (await page.isVisible('text=Completar')) {
          console.log('❌ PROBLEM: App accepted the Google screenshot!');
          console.log('This should not happen - random screenshots should be rejected');
        }
        
        await page.screenshot({ path: 'test-real-app-screenshot-result.png' });
        break;
      }
      
      // Complete current step
      if (await page.isVisible('button:has-text("Completar")')) {
        await page.click('button:has-text("Completar")');
        stepCount++;
      } else {
        break;
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-real-app-error.png' });
  } finally {
    console.log('\nKeeping browser open for manual inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

testRealAppScreenshot().catch(console.error);