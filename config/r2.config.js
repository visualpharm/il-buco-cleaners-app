// This file contains sensitive R2 configuration and is not committed to Git
// Add this file to your .gitignore

module.exports = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  
  // Derived values
  get endpoint() {
    return `https://${this.accountId}.r2.cloudflarestorage.com`;
  },
  get publicBaseUrl() {
    return this.publicUrl || `https://pub-${this.accountId}.r2.dev/${this.bucketName}`;
  }
};
