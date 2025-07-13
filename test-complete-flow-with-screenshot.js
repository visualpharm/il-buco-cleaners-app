const { chromium } = require('playwright');
const path = require('path');

async function testCompleteFlow() {
  console.log('Testing complete flow with Google screenshot...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Go to main app
    await page.goto('http://localhost:3000/?cleaner=ivan');
    console.log('1. Loaded app with Ivan profile');
    await page.waitForTimeout(1000);
    
    // Click Giardino
    await page.click('text=Giardino');
    console.log('2. Selected Giardino room');
    await page.waitForTimeout(1000);
    
    // Complete steps until photo is required
    let stepCount = 0;
    let foundPhotoStep = false;
    
    while (stepCount < 10 && !foundPhotoStep) {
      // Check if we see the photo requirement
      const photoRequired = await page.isVisible('text=Cama completa');
      
      if (photoRequired) {
        console.log(`3. Found photo requirement at step ${stepCount + 1}`);
        foundPhotoStep = true;
        
        // Take a screenshot of a website first
        const googlePage = await context.newPage();
        await googlePage.goto('https://www.google.com');
        await googlePage.screenshot({ path: 'test-google-new.png' });
        await googlePage.close();
        console.log('4. Created Google screenshot');
        
        // Upload it
        await page.setInputFiles('input[type="file"]', path.join(__dirname, 'test-google-new.png'));
        console.log('5. Uploaded Google screenshot');
        
        // Wait for validation
        await page.waitForTimeout(5000);
        
        // Check the result
        const errorVisible = await page.isVisible('text=Intento 1 de 2');
        if (errorVisible) {
          console.log('6. ✅ Validation failed as expected');
          
          // Get the error message
          const errorMessage = await page.$eval('.text-red-800 .font-semibold', el => el.textContent);
          console.log('7. Error message:', errorMessage);
          
          // Check if it says "Foto incorrecta"
          if (errorMessage.includes('Foto incorrecta')) {
            console.log('8. ✅ CORRECT: Identified as wrong type of photo');
            console.log('   Full message:', errorMessage);
          } else {
            console.log('8. ⚠️ Still looking for bedroom elements in screenshot');
          }
        } else {
          console.log('6. ❌ ERROR: Screenshot was accepted!');
        }
        
        await page.screenshot({ path: 'test-complete-flow-result.png' });
        break;
      }
      
      // Complete current step
      const completeButton = await page.$('button:has-text("Completar")');
      if (completeButton) {
        await completeButton.click();
        console.log(`   Completed step ${stepCount + 1}`);
        stepCount++;
        await page.waitForTimeout(1000);
      } else {
        console.log('   No complete button found');
        break;
      }
    }
    
    if (!foundPhotoStep) {
      console.log('Did not find photo requirement step');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-complete-flow-error.png' });
  } finally {
    console.log('\nTest complete. Keeping browser open...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testCompleteFlow().catch(console.error);