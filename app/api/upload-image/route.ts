import { NextResponse } from "next/server";
import { saveImage } from "@/lib/storage";
import { DatabaseService } from "@/lib/database";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;
    const type = formData.get("type") as string | null; // 'before' or 'after'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Save file to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = await saveImage(buffer, file.name, sessionId || undefined);

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
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
