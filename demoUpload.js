console.log('__dirname:', __dirname);
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { uploadCleanerImage } = require('./services/r2Service'); // updated for Cloudflare R2

async function demo() {
  const cleanerId = 'demo-cleaner';
  const filePath = path.join(__dirname, 'demo-photo.jpg'); // Place a demo-photo.jpg in project root
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = 'demo-photo.jpg';
  const mimeType = 'image/jpeg';

  try {
    const url = await uploadCleanerImage(cleanerId, fileBuffer, fileName, mimeType);
    console.log('Uploaded to:', url);
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

demo();
