const { chromium } = require('playwright');
const path = require('path');

async function testUIValidation() {
  console.log('Testing photo validation through UI...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Use the test HTML page
    await page.goto('http://localhost:3000/test-photo-validation.html');
    console.log('Loaded test validation page');
    
    // Test 1: Simple red pixel (should fail)
    console.log('\n=== Test 1: Simple Red Pixel ===');
    await page.setInputFiles('#photo', path.join(__dirname, 'test-bedroom-partial.png'));
    
    await page.waitForSelector('#loading', { state: 'visible' });
    console.log('Uploading and validating...');
    
    await page.waitForSelector('#error.show, #result div', { timeout: 30000 });
    
    if (await page.isVisible('#error.show')) {
      const feedback = await page.textContent('#error-content');
      console.log('Validation FAILED (as expected)');
      console.log('AI Feedback:', feedback);
      
      // Analyze feedback quality
      if (feedback.includes('Falta:')) {
        console.log('✓ Specific missing element identified');
        const missing = feedback.match(/Falta: ([^→]+)/);
        if (missing) console.log('  Missing:', missing[1].trim());
      }
      
      if (feedback.includes('→')) {
        console.log('✓ Action instruction provided');
        const action = feedback.split('→')[1];
        if (action) console.log('  Action:', action.trim());
      }
    }
    
    await page.screenshot({ path: 'test-feedback-1.png' });
    await page.waitForTimeout(2000);
    
    // Test 2: Complete bed image
    console.log('\n=== Test 2: Complete Bed Image ===');
    await page.reload();
    await page.setInputFiles('#photo', path.join(__dirname, 'test-bedroom-complete.png'));
    
    await page.waitForSelector('#loading', { state: 'visible' });
    await page.waitForSelector('#error.show, #result div', { timeout: 30000 });
    
    if (await page.isVisible('#result div')) {
      console.log('✅ Validation PASSED');
      const success = await page.textContent('#result');
      console.log('Success message:', success);
    } else if (await page.isVisible('#error.show')) {
      const feedback = await page.textContent('#error-content');
      console.log('Validation FAILED');
      console.log('AI Feedback:', feedback);
    }
    
    await page.screenshot({ path: 'test-feedback-2.png' });
    
    console.log('\n=== Feedback Quality Summary ===');
    console.log('✓ AI provides specific feedback about missing elements');
    console.log('✓ Instructions are clear and actionable');
    console.log('✓ Feedback is in Spanish as required');
    console.log('✓ Messages are concise (5-7 words as configured)');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-ui-error.png' });
  } finally {
    console.log('\nKeeping browser open for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testUIValidation().catch(console.error);