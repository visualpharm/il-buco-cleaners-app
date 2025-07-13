const { chromium } = require('playwright');
const path = require('path');
const { createCanvas } = require('canvas');
const fs = require('fs');

async function createTestImages() {
  // Create different types of irrelevant images
  
  // 1. Text-only image (like a document)
  const canvas1 = createCanvas(800, 600);
  const ctx1 = canvas1.getContext('2d');
  ctx1.fillStyle = 'white';
  ctx1.fillRect(0, 0, 800, 600);
  ctx1.fillStyle = 'black';
  ctx1.font = '24px Arial';
  ctx1.fillText('This is a document', 50, 100);
  ctx1.fillText('Not a bedroom photo', 50, 150);
  ctx1.fillText('Random text here', 50, 200);
  fs.writeFileSync('test-document.png', canvas1.toBuffer());
  
  // 2. Abstract pattern
  const canvas2 = createCanvas(800, 600);
  const ctx2 = canvas2.getContext('2d');
  for (let i = 0; i < 20; i++) {
    ctx2.fillStyle = `hsl(${i * 18}, 70%, 50%)`;
    ctx2.fillRect(i * 40, 0, 40, 600);
  }
  fs.writeFileSync('test-abstract.png', canvas2.toBuffer());
  
  // 3. Graph/chart
  const canvas3 = createCanvas(800, 600);
  const ctx3 = canvas3.getContext('2d');
  ctx3.fillStyle = 'white';
  ctx3.fillRect(0, 0, 800, 600);
  ctx3.strokeStyle = 'black';
  ctx3.beginPath();
  ctx3.moveTo(100, 500);
  ctx3.lineTo(700, 500);
  ctx3.moveTo(100, 100);
  ctx3.lineTo(100, 500);
  ctx3.stroke();
  ctx3.fillStyle = 'blue';
  ctx3.fillRect(150, 300, 80, 200);
  ctx3.fillRect(250, 200, 80, 300);
  ctx3.fillRect(350, 250, 80, 250);
  fs.writeFileSync('test-chart.png', canvas3.toBuffer());
  
  console.log('Created test images: test-document.png, test-abstract.png, test-chart.png');
}

async function testIrrelevantImages() {
  await createTestImages();
  
  console.log('Testing validation with various irrelevant images...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testImages = [
    { file: 'test-google-screenshot.png', description: 'Google homepage screenshot' },
    { file: 'test-document.png', description: 'Text document' },
    { file: 'test-abstract.png', description: 'Abstract pattern' },
    { file: 'test-chart.png', description: 'Business chart' }
  ];
  
  try {
    await page.goto('http://localhost:3000/test-photo-validation.html');
    console.log('Loaded test validation page');
    
    for (const testImage of testImages) {
      console.log(`\n=== Testing: ${testImage.description} ===`);
      
      if (!fs.existsSync(testImage.file)) {
        console.log(`Skipping ${testImage.file} - not found`);
        continue;
      }
      
      // Reload page for fresh test
      await page.reload();
      
      // Upload the image
      await page.setInputFiles('#photo', path.join(__dirname, testImage.file));
      
      await page.waitForSelector('#loading', { state: 'visible' });
      console.log('Validating...');
      
      // Wait for result
      await page.waitForSelector('#error.show, #result div', { timeout: 30000 });
      
      if (await page.isVisible('#error.show')) {
        const feedback = await page.textContent('#error-content');
        console.log('✅ Validation FAILED (as expected)');
        console.log('Feedback:', feedback);
        
        // Check if it mentions "Foto incorrecta"
        if (feedback.includes('Foto incorrecta')) {
          console.log('✓ Correctly identified as wrong type of photo');
        } else if (feedback.includes('Falta:')) {
          console.log('⚠ Still looking for specific elements in irrelevant image');
        }
      } else {
        console.log('❌ PROBLEM: Validation passed for irrelevant image!');
      }
      
      await page.waitForTimeout(1000);
    }
    
    console.log('\n=== Summary ===');
    console.log('The AI should now recognize when images are completely irrelevant');
    console.log('and provide clearer error messages like "Foto incorrecta: no es cama completa"');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('\nKeeping browser open for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testIrrelevantImages().catch(console.error);