import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Determine uploads directory based on environment
const getUploadsDir = () => {
  if (process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR;
  }
  
  // Vercel and other serverless environments
  if (process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp/uploads';
  }
  
  // Default for traditional deployments
  return './uploads';
};

const UPLOADS_DIR = getUploadsDir();

// Determine base URL for serving files
const getBaseUrl = () => {
  if (process.env.NGINX_BASE_URL) {
    return process.env.NGINX_BASE_URL;
  }
  
  // For Vercel and serverless, files in /tmp aren't web-accessible
  // You'd need to implement a file serving API route
  if (process.env.VERCEL || process.env.NETLIFY) {
    return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  }
  
  // Default for local development without nginx - use relative paths
  return '';
};

const BASE_URL = getBaseUrl();

// Ensure uploads directory exists
export async function ensureUploadsDir(): Promise<void> {
  try {
    await fs.access(UPLOADS_DIR);
    console.log(`✓ Uploads directory exists: ${UPLOADS_DIR}`);
  } catch (error) {
    console.log(`📁 Creating uploads directory: ${UPLOADS_DIR}`);
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      console.log(`✅ Created uploads directory: ${UPLOADS_DIR}`);
    } catch (createError) {
      console.error(`❌ Failed to create uploads directory: ${UPLOADS_DIR}`, createError);
      throw new Error(`Cannot create uploads directory: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
    }
  }
}

export async function saveImage(
  buffer: Buffer,
  originalName: string,
  sessionId?: string
): Promise<{ filename: string; url: string }> {
  // Debug: log upload intent
  console.log('[saveImage] Uploading:', originalName, 'sessionId:', sessionId);

  await ensureUploadsDir();

  const ext = path.extname(originalName);
  const filename = `${uuidv4()}${ext}`;
  const subDir = sessionId ? `sessions/${sessionId}` : 'general';
  const fullDir = path.join(UPLOADS_DIR, subDir);
  
  // Ensure subdirectory exists
  await fs.mkdir(fullDir, { recursive: true });
  
  const filePath = path.join(fullDir, filename);
  await fs.writeFile(filePath, buffer);

  // Debug: log where file was written
  console.log('[saveImage] File written to:', filePath);

  // Generate URL based on environment
  let url: string;
  if (process.env.VERCEL || process.env.NETLIFY || !BASE_URL) {
    // Use API route for serving files in serverless environments or local dev
    const prefix = BASE_URL || '';
    url = `${prefix}/api/files/${subDir}/${filename}`;
  } else {
    // Use nginx for traditional deployments with explicit BASE_URL
    url = `${BASE_URL}/uploads/${subDir}/${filename}`;
  }
  
  return { filename, url };
}

export async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const result = await saveImage(buffer, file.name);
  return result.url;
}

export async function deleteImage(filename: string, sessionId?: string): Promise<void> {
  const subDir = sessionId ? `sessions/${sessionId}` : 'general';
  const filePath = path.join(UPLOADS_DIR, subDir, filename);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to delete image ${filename}:`, error);
  }
}

export async function getImagePath(filename: string, sessionId?: string): Promise<string | null> {
  const subDir = sessionId ? `sessions/${sessionId}` : 'general';
  const filePath = path.join(UPLOADS_DIR, subDir, filename);
  
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

export function getImageUrl(filename: string, sessionId?: string): string {
  const subDir = sessionId ? `sessions/${sessionId}` : 'general';
  
  // Generate URL based on environment
  if (process.env.VERCEL || process.env.NETLIFY || !BASE_URL) {
    // Use API route for serving files in serverless environments or local dev
    const prefix = BASE_URL || '';
    return `${prefix}/api/files/${subDir}/${filename}`;
  } else {
    // Use nginx for traditional deployments with explicit BASE_URL
    return `${BASE_URL}/uploads/${subDir}/${filename}`;
  }
}
