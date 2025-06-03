import { NextResponse } from 'next/server';
import { uploadCleanerImage } from '@/services/r2Service';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name || `upload-${Date.now()}.jpg`;
    const mimeType = file.type || 'image/jpeg';
    const cleanerId = 'web-upload';

    const url = await uploadCleanerImage(
      cleanerId,
      buffer,
      fileName,
      mimeType
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
