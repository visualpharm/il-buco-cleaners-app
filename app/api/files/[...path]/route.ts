import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Serve uploaded files for serverless environments where nginx isn't available
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get uploads directory
    const uploadsDir = process.env.UPLOADS_DIR || (
      process.env.VERCEL ? '/tmp/uploads' : './uploads'
    );
    
    // Construct file path from URL segments
    const filePath = path.join(uploadsDir, ...params.path);
    
    // Security: Ensure the file is within the uploads directory
    const resolvedFilePath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedFilePath.startsWith(resolvedUploadsDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Check if file exists
    try {
      await fs.access(resolvedFilePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read file
    const fileBuffer = await fs.readFile(resolvedFilePath);
    
    // Determine content type based on file extension
    const ext = path.extname(resolvedFilePath).toLowerCase();
    const contentType = getContentType(ext);
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getContentType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}