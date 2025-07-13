const { createCanvas } = require('canvas');
const fs = require('fs');

// Create a simple bedroom image
function createBedroomImage() {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // Background - light blue wall
  ctx.fillStyle = '#E6F3FF';
  ctx.fillRect(0, 0, 800, 400);
  
  // Floor - brown
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 400, 800, 200);
  
  // Bed frame - dark brown
  ctx.fillStyle = '#654321';
  ctx.fillRect(150, 250, 400, 200);
  
  // Mattress - light gray
  ctx.fillStyle = '#D3D3D3';
  ctx.fillRect(170, 270, 360, 150);
  
  // Pillow - white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(200, 280, 100, 60);
  ctx.fillRect(400, 280, 100, 60);
  
  // Sheet - light blue (partial coverage)
  ctx.fillStyle = '#ADD8E6';
  ctx.fillRect(170, 340, 360, 80);
  
  // Nightstand - brown
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(50, 350, 80, 100);
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('test-bedroom-partial.png', buffer);
  console.log('Created test-bedroom-partial.png - bed with partial sheet coverage');
}

// Create a messy bed image
function createMessyBedImage() {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#E6F3FF';
  ctx.fillRect(0, 0, 800, 400);
  
  // Floor
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 400, 800, 200);
  
  // Bed frame
  ctx.fillStyle = '#654321';
  ctx.fillRect(150, 250, 400, 200);
  
  // Mattress
  ctx.fillStyle = '#D3D3D3';
  ctx.fillRect(170, 270, 360, 150);
  
  // Messy sheets - various rectangles
  ctx.fillStyle = '#ADD8E6';
  ctx.save();
  ctx.translate(350, 350);
  ctx.rotate(0.2);
  ctx.fillRect(-100, -50, 200, 100);
  ctx.restore();
  
  // Pillow out of place
  ctx.fillStyle = '#FFFFFF';
  ctx.save();
  ctx.translate(300, 320);
  ctx.rotate(-0.3);
  ctx.fillRect(-50, -30, 100, 60);
  ctx.restore();
  
  // Nightstand
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(50, 350, 80, 100);
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('test-bedroom-messy.png', buffer);
  console.log('Created test-bedroom-messy.png - messy bed');
}

// Create a well-made bed image
function createWellMadeBedImage() {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#E6F3FF';
  ctx.fillRect(0, 0, 800, 400);
  
  // Floor
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 400, 800, 200);
  
  // Bed frame
  ctx.fillStyle = '#654321';
  ctx.fillRect(150, 250, 400, 200);
  
  // Mattress
  ctx.fillStyle = '#D3D3D3';
  ctx.fillRect(170, 270, 360, 150);
  
  // Sheet - properly placed
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(170, 270, 360, 150);
  
  // Pillows - properly aligned
  ctx.fillStyle = '#F0F0F0';
  ctx.fillRect(200, 280, 100, 60);
  ctx.fillRect(400, 280, 100, 60);
  
  // Duvet/comforter - light blue, properly aligned
  ctx.fillStyle = '#ADD8E6';
  ctx.fillRect(170, 340, 360, 80);
  
  // Bed footer with wrinkles (darker blue lines)
  ctx.strokeStyle = '#4682B4';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(170 + i * 70, 420);
    ctx.lineTo(170 + i * 70 + 20, 430);
    ctx.stroke();
  }
  
  // Nightstand
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(50, 350, 80, 100);
  
  // Polar blanket on nightstand
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect(60, 340, 60, 20);
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('test-bedroom-complete.png', buffer);
  console.log('Created test-bedroom-complete.png - well-made bed with all requirements');
}

createBedroomImage();
createMessyBedImage();
createWellMadeBedImage();