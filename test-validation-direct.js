const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testValidationDirectly() {
  console.log('Testing AI photo validation directly via API...\n');
  
  const testImages = [
    { 
      file: 'test-bedroom-partial.png', 
      description: 'Bed with partial sheet coverage',
      expectedFeedback: 'Should mention missing pillowcases, duvet alignment, or polar blanket'
    },
    { 
      file: 'test-bedroom-messy.png', 
      description: 'Messy bed',
      expectedFeedback: 'Should mention wrinkled sheets, misaligned pillows'
    },
    { 
      file: 'test-bedroom-complete.png', 
      description: 'Well-made bed with all requirements',
      expectedFeedback: 'Should pass or mention minor issues'
    }
  ];
  
  const requirement = 'Mostrá la cama completa con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar en mesita de luz';
  
  for (const testImage of testImages) {
    console.log(`\n=== Testing: ${testImage.description} ===`);
    
    const imagePath = path.join(__dirname, testImage.file);
    if (!fs.existsSync(imagePath)) {
      console.log(`Creating a simple test image...`);
      // Create a simple red pixel as fallback
      const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      fs.writeFileSync(imagePath, Buffer.from(redPixelBase64, 'base64'));
    }
    
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    form.append('descripcion', requirement);
    form.append('titulo', 'Cama Completa');
    
    try {
      console.log('Sending to API...');
      const response = await fetch('http://localhost:3000/api/validate-photo', {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });
      
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('\nAI Response:');
      console.log('Valid:', result.esValido ? '✅ YES' : '❌ NO');
      
      if (result.analisis) {
        console.log('\nFeedback:');
        console.log('Expected:', result.analisis.esperaba);
        console.log('Found:', result.analisis.encontro);
        
        // Evaluate feedback quality
        console.log('\nFeedback Quality:');
        if (result.analisis.esperaba.includes('Falta:')) {
          console.log('✓ Specific missing element identified');
        }
        if (result.analisis.encontro.includes('→') || result.analisis.encontro.length > 10) {
          console.log('✓ Actionable instruction provided');
        }
        console.log(`Expected pattern: ${testImage.expectedFeedback}`);
      }
      
    } catch (error) {
      console.error('API test failed:', error.message);
    }
  }
  
  console.log('\n\n=== Overall Feedback Quality Evaluation ===');
  console.log('The AI validation system should:');
  console.log('1. Identify specific missing elements (sheets, pillows, blanket)');
  console.log('2. Provide clear, actionable instructions');
  console.log('3. Use concise Spanish phrases');
  console.log('4. Be reasonable about what can be seen in the image');
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testValidationDirectly().catch(console.error);