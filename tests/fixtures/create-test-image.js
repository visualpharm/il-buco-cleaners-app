const fs = require('fs');
const path = require('path');

// Create a simple test image (1x1 pixel red PNG)
const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const imageBuffer = Buffer.from(redPixelBase64, 'base64');

fs.writeFileSync(path.join(__dirname, 'test-bed.png'), imageBuffer);
console.log('Test image created: test-bed.png');