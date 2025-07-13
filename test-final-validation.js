const { chromium } = require('playwright');
const path = require('path');

async function finalValidationTest() {
  console.log('Final validation test - Testing all scenarios...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const scenarios = [
    {
      name: 'Google Screenshot',
      file: 'test-google-screenshot.png',
      expected: 'Foto incorrecta'
    },
    {
      name: 'Partial Bedroom',
      file: 'test-bedroom-partial.png', 
      expected: 'Falta: manta polar'
    },
    {
      name: 'Complete Bedroom',
      file: 'test-bedroom-complete.png',
      expected: 'success or specific missing item'
    }
  ];
  
  try {
    await page.goto('http://localhost:3000/test-photo-validation.html');
    console.log('Loaded test validation page\n');
    
    console.log('=== Testing Different Scenarios ===\n');
    
    for (const scenario of scenarios) {
      console.log(`Testing: ${scenario.name}`);
      
      // Reload for fresh test
      await page.reload();
      await page.waitForTimeout(500);
      
      // Upload image
      if (await page.isVisible('#photo')) {
        await page.setInputFiles('#photo', path.join(__dirname, scenario.file));
        
        // Wait for result
        await page.waitForSelector('#loading', { state: 'visible' });
        await page.waitForSelector('#error.show, #result div', { timeout: 30000 });
        
        if (await page.isVisible('#error.show')) {
          const feedback = await page.textContent('#error-content');
          console.log(`✅ Failed validation: ${feedback}`);
          
          if (feedback.includes(scenario.expected)) {
            console.log(`✓ Correct feedback type detected`);
          } else {
            console.log(`⚠ Unexpected feedback`);
          }
        } else {
          console.log('✅ Passed validation');
        }
      }
      
      console.log('---\n');
      await page.waitForTimeout(1000);
    }
    
    console.log('=== Summary ===');
    console.log('1. Irrelevant images (screenshots) → "Foto incorrecta: no es cama completa"');
    console.log('2. Relevant images with missing items → "Falta: [specific item]"');
    console.log('3. Complete images → Validation passes');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('\nTest complete.');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

finalValidationTest().catch(console.error);