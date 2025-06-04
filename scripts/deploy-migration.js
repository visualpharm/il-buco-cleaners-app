#!/usr/bin/env node

/**
 * Deployment migration script that runs automatically during build/deployment
 * This ensures the database schema is always up to date
 */

const { runMigration } = require('./migrate-to-english');

async function deploymentMigration() {
  console.log('🚀 Running deployment migration...');
  
  try {
    // Set environment to avoid interactive prompts
    process.env.DRY_RUN = 'false';
    
    // Run the migration
    await runMigration();
    
    console.log('✅ Deployment migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Deployment migration failed:', error);
    
    // In deployment, we want to fail gracefully if DB is not available
    // but still allow the app to start
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.log('⚠️  Database not available during build, migration will run on first app start');
      process.exit(0);
    }
    
    // For other errors, fail the deployment
    process.exit(1);
  }
}

if (require.main === module) {
  deploymentMigration();
}

module.exports = { deploymentMigration };