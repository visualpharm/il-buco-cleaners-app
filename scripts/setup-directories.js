#!/usr/bin/env node

/**
 * Setup required directories for the application
 * This ensures uploads directory exists before the application starts
 */

const fs = require('fs').promises;
const path = require('path');

async function setupDirectories() {
  console.log('📁 Setting up required directories...');
  
  try {
    // Determine uploads directory based on environment
    const uploadsDir = process.env.UPLOADS_DIR || (
      process.env.VERCEL ? '/tmp/uploads' : './uploads'
    );
    
    console.log(`📁 Creating uploads directory: ${uploadsDir}`);
    
    // Create main uploads directory
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Create subdirectories
    const subdirs = ['general', 'sessions'];
    for (const subdir of subdirs) {
      const fullPath = path.join(uploadsDir, subdir);
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${fullPath}`);
    }
    
    // Verify directories exist
    for (const subdir of ['', ...subdirs]) {
      const dirPath = path.join(uploadsDir, subdir);
      try {
        await fs.access(dirPath);
        console.log(`✓ Verified: ${dirPath}`);
      } catch (error) {
        console.error(`❌ Failed to verify: ${dirPath}`, error);
        process.exit(1);
      }
    }
    
    console.log('✅ All directories setup successfully');
    
    // Set environment variable for the application
    if (process.env.VERCEL) {
      console.log('🔧 Vercel environment detected - using /tmp/uploads');
      process.env.UPLOADS_DIR = '/tmp/uploads';
    }
    
  } catch (error) {
    console.error('❌ Failed to setup directories:', error);
    
    // For serverless environments, this might fail but that's OK
    if (process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.log('⚠️  Serverless environment detected - directories will be created at runtime');
      process.exit(0);
    }
    
    // For other environments, this is a critical error
    process.exit(1);
  }
}

if (require.main === module) {
  setupDirectories();
}

module.exports = { setupDirectories };