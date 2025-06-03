const { uploadCleanerImage } = require('../services/s3Service');

// Inside your route handler:
const imageUrl = await uploadCleanerImage(cleanerId, fileBuffer, fileName, mimeType);
// Save imageUrl to DB or return to client