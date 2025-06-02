// This is a basic implementation. In production, you'd want to use a service like AWS S3, Cloudinary, or similar.
// This example assumes you're storing files in the public directory, which is not recommended for production.

import { writeFile } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function saveFile(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `photo_${timestamp}.${ext}`;
    const path = join(UPLOAD_DIR, filename);
    
    // Ensure the upload directory exists
    const fs = await import('fs');
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    
    // Save the file
    await writeFile(path, buffer);
    
    // Return the public URL
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
}
