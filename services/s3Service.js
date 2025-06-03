const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET = process.env.AWS_S3_BUCKET;

async function uploadCleanerImage(cleanerId, fileBuffer, fileName, mimeType) {
  const key = `cleaners/${cleanerId}/${fileName}`;
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  };
  await s3.upload(params).promise();
  // Use the AWS SDK to generate the correct public URL
  const url = s3.getSignedUrl('getObject', {
    Bucket: BUCKET,
    Key: key,
    Expires: 60 * 60 * 24 * 7, // 7 days, but for public-read, this is just for URL formatting
  });
  // Remove query params for public-read objects
  return url.split('?')[0];
}

module.exports = { uploadCleanerImage };
