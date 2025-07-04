import { NextResponse } from "next/server";
import { saveImage } from "@/lib/storage";
import { DatabaseService } from "@/lib/database";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] Upload API called');
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;
    const type = formData.get("type") as string | null; // 'before' or 'after'

    if (!file) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[DEV] No file in form data');
      }
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] File received:', {
        name: file.name,
        size: file.size,
        type: file.type,
        sessionId,
        uploadType: type
      });
    }

    // Save file to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = await saveImage(buffer, file.name, sessionId || undefined);

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] File saved successfully:', result);
    }

    // Save photo record to database if sessionId provided
    if (sessionId && type) {
      await DatabaseService.savePhoto({
        id: uuidv4(),
        sessionId,
        type: type as 'before' | 'after',
        filename: result.filename,
        url: result.url,
        uploadedAt: new Date()
      });
    }

    return NextResponse.json({ url: result.url, filename: result.filename });
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    };
    
    console.error("Upload error:", errorDetails);
    
    return NextResponse.json(
      {
        error: "Upload failed",
        details: errorDetails.message,
        ...(process.env.NODE_ENV === 'development' ? { debug: errorDetails } : {})
      },
      { status: 500 }
    );
  }
}
