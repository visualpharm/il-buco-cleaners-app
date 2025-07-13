const { chromium } = require('playwright');
const path = require('path');

async function testScreenshotValidation() {
  console.log('Testing validation with a random screenshot...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Create a simple screenshot by taking a screenshot of a test page
    const testPage = await context.newPage();
    await testPage.setContent('<html><body><h1>Random Screenshot</h1><p>This is not a bedroom photo!</p></body></html>');
    await testPage.screenshot({ path: 'test-random-screenshot.png' });
    await testPage.close();
    
    // Use the test HTML page
    await page.goto('http://localhost:3000/test-photo-validation.html');
    console.log('Loaded test validation page');
    
    // Upload the random screenshot
    console.log('\n=== Testing with Random Screenshot ===');
    await page.setInputFiles('#photo', path.join(__dirname, 'test-random-screenshot.png'));
    
    await page.waitForSelector('#loading', { state: 'visible' });
    console.log('Uploading and validating...');
    
    // Wait for result
    await page.waitForSelector('#error.show, #result div', { timeout: 30000 });
    
    if (await page.isVisible('#error.show')) {
      const feedback = await page.textContent('#error-content');
      console.log('✅ Validation FAILED (as expected for non-bedroom screenshot)');
      console.log('AI Feedback:', feedback);
    } else if (await page.isVisible('#result div')) {
      const success = await page.textContent('#result');
      console.log('❌ PROBLEM: Validation PASSED (should have failed!)');
      console.log('Success message:', success);
      console.log('\nThis indicates the validation is not working properly!');
    }
    
    await page.screenshot({ path: 'test-screenshot-result.png' });
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-screenshot-error.png' });
  } finally {
    console.log('\nKeeping browser open for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testScreenshotValidation().catch(console.error);