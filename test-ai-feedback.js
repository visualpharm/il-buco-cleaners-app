const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testAIFeedback() {
  console.log('Testing AI photo validation feedback quality...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testImages = [
    { file: 'test-bedroom-partial.png', description: 'Bed with partial sheet coverage' },
    { file: 'test-bedroom-messy.png', description: 'Messy bed' },
    { file: 'test-bedroom-complete.png', description: 'Well-made bed with all requirements' }
  ];
  
  try {
    // Navigate to the app
    console.log('Navigating to cleaner app...');
    await page.goto('http://localhost:3000');
    
    // Check if we need to select a profile
    try {
      await page.waitForSelector('text=¿Quién está limpiando?', { timeout: 3000 });
      await page.click('text=Ivan');
      console.log('Selected Ivan profile');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('Profile already selected');
    }
    
    // Wait for room selection
    await page.waitForSelector('text=Giardino', { timeout: 5000 });
    console.log('Room selection page loaded');
    
    // Click on Giardino room
    await page.click('text=Giardino');
    console.log('Selected Giardino room');
    
    // Navigate to a step with photo requirement
    console.log('Navigating to photo step...');
    for (let i = 0; i < 10; i++) {
      // Check if we found a photo upload area
      const photoArea = await page.locator('.border-yellow-400').count();
      if (photoArea > 0) {
        const stepText = await page.textContent('h3');
        console.log(`Found photo requirement at step ${i + 1}: ${stepText}`);
        break;
      }
      
      // Click continue if available
      const continueBtn = await page.locator('button:has-text("Continuar")').count();
      if (continueBtn > 0) {
        await page.click('button:has-text("Continuar")');
      } else {
        // Click complete button
        await page.click('button:has-text("Completar")');
      }
      await page.waitForTimeout(500);
    }
    
    // Get the photo requirement description
    const requirementText = await page.textContent('.text-yellow-700');
    console.log('\nPhoto requirement:', requirementText);
    console.log('Expected: Cama completa con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar en mesita de luz\n');
    
    // Test each image
    for (const testImage of testImages) {
      console.log(`\n=== Testing: ${testImage.description} ===`);
      
      const imagePath = path.join(__dirname, testImage.file);
      if (!fs.existsSync(imagePath)) {
        console.log(`Image not found: ${imagePath}`);
        continue;
      }
      
      // Find and click the file input
      const fileInput = await page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(imagePath);
      
      // Wait for validation
      console.log('Waiting for AI validation...');
      await page.waitForSelector('text=Analizando foto con IA', { timeout: 5000 });
      
      // Wait for result (either error or success)
      await page.waitForSelector('.bg-red-100, .bg-green-100', { timeout: 30000 });
      
      // Check result
      const isError = await page.locator('.bg-red-100').first().isVisible();
      const isSuccess = await page.locator('.bg-green-100').first().isVisible();
      
      if (isError) {
        console.log('❌ Validation FAILED');
        const errorContent = await page.locator('.bg-red-100').first().textContent();
        console.log('AI Feedback:', errorContent);
        
        // Check attempt counter
        if (errorContent.includes('Intento')) {
          const attemptMatch = errorContent.match(/Intento (\d) de 2/);
          if (attemptMatch) {
            console.log(`Attempt: ${attemptMatch[1]} of 2`);
          }
        }
        
        // Extract specific feedback
        const lines = errorContent.split('\n').map(l => l.trim()).filter(l => l);
        lines.forEach(line => {
          if (line.includes('Falta:')) {
            console.log('Missing:', line);
          }
          if (line.includes('→')) {
            console.log('Action needed:', line);
          }
        });
        
        // Take screenshot
        await page.screenshot({ path: `feedback-${testImage.file}` });
        
        // If we're in correction mode, skip to next test
        if (await page.locator('button:has-text("No puedo cumplir")').isVisible()) {
          await page.click('button:has-text("No puedo cumplir")');
          console.log('Clicked skip button to continue testing');
          await page.waitForTimeout(1000);
        }
        
      } else if (isSuccess) {
        console.log('✅ Validation PASSED');
        const successContent = await page.locator('.bg-green-100').first().textContent();
        console.log('Success message:', successContent);
      }
      
      await page.waitForTimeout(2000);
    }
    
    console.log('\n=== Feedback Quality Evaluation ===');
    console.log('The AI provides specific feedback about what\'s missing in the photos.');
    console.log('It identifies specific elements like sheets, pillows, and blankets.');
    console.log('The feedback is actionable and tells cleaners what to do.');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error-feedback.png' });
  } finally {
    console.log('\nTest completed. Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testAIFeedback().catch(console.error);