const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/r2.config');

// Validate required configuration
if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
  console.error('Missing required R2 configuration. File uploads will fail.');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: config.endpoint,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

const BUCKET = config.bucketName;
const PUBLIC_URL = config.publicBaseUrl;

async function uploadCleanerImage(cleanerId, fileBuffer, fileName, mimeType) {
  const key = `cleaners/${cleanerId}/${Date.now()}-${fileName}`;
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read', // R2 ignores this, but harmless
  };
  try {
    await s3.send(new PutObjectCommand(params));
    // Remove any double slashes in the URL
    return `${PUBLIC_URL.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
}

module.exports = { uploadCleanerImage };
