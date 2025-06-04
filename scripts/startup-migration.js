#!/usr/bin/env node

/**
 * Startup migration script for production deployments
 * Runs migration safely at application startup when database is available
 */

const { runMigration } = require('./migrate-to-english');

async function startupMigration() {
  console.log('🚀 Running startup migration check...');
  
  try {
    // Set environment to avoid interactive prompts
    process.env.DRY_RUN = 'false';
    
    // Add startup delay to ensure database is ready
    console.log('⏳ Waiting for database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run the migration
    await runMigration();
    
    console.log('✅ Startup migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Startup migration failed:', error);
    
    // In production startup, we want to be more forgiving
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('connect') ||
        error.message.includes('ENOTFOUND')) {
      console.log('⚠️  Database not yet available, will retry on next restart');
      console.log('🚀 Application will start without migration - manual migration may be needed');
      process.exit(0);
    }
    
    // For critical migration errors, fail the startup
    console.error('🔥 Critical migration error - failing startup');
    process.exit(1);
  }
}

if (require.main === module) {
  startupMigration();
}

module.exports = { startupMigration };