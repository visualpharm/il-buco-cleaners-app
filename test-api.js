const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testPhotoValidationAPI() {
  console.log('Testing photo validation API...');
  
  // Create a test image
  const testImagePath = path.join(__dirname, 'test-bedroom.jpg');
  const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  fs.writeFileSync(testImagePath, Buffer.from(redPixelBase64, 'base64'));
  
  const form = new FormData();
  form.append('file', fs.createReadStream(testImagePath));
  form.append('descripcion', 'Mostrá la cama completa con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar en mesita de luz');
  form.append('titulo', 'Cama Completa');
  
  try {
    const response = await fetch('http://localhost:3000/api/validate-photo', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Validation result:', JSON.stringify(result, null, 2));
    
    if (result.esValido === false) {
      console.log('\n✓ Photo validation failed (as expected for test image)');
      console.log('Feedback received:');
      console.log('- What\'s missing:', result.analisis.esperaba);
      console.log('- What to do:', result.analisis.encontro);
    } else {
      console.log('\n✗ Photo validation passed (unexpected for test image)');
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  } finally {
    // Clean up
    fs.unlinkSync(testImagePath);
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testPhotoValidationAPI().catch(console.error);