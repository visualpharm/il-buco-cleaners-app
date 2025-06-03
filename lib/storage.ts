import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
const BASE_URL = process.env.NGINX_BASE_URL || 'http://localhost:8080';

// Ensure uploads directory exists
export async function ensureUploadsDir(): Promise<void> {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function saveImage(
  buffer: Buffer,
  originalName: string,
  sessionId?: string
): Promise<{ filename: string; url: string }> {
  await ensureUploadsDir();

  const ext = path.extname(originalName);
  const filename = `${uuidv4()}${ext}`;
  const subDir = sessionId ? `sessions/${sessionId}` : 'general';
  const fullDir = path.join(UPLOADS_DIR, subDir);
  
  // Ensure subdirectory exists
  await fs.mkdir(fullDir, { recursive: true });
  
  const filePath = path.join(fullDir, filename);
  await fs.writeFile(filePath, buffer);

  const url = `${BASE_URL}/uploads/${subDir}/${filename}`;
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
  return `${BASE_URL}/uploads/${subDir}/${filename}`;
}
