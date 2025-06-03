import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME
    ) {
      console.error("Missing R2 environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name || `upload-${Date.now()}.jpg`
    const mimeType = file.type || "image/jpeg"
    const cleanerId = "web-upload"

    // Create S3 client with explicit configuration
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      // Disable automatic credential detection
      forcePathStyle: true,
      // Disable loading credentials from files
      credentialDefaultProvider: () => ({
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      }),
    })

    // Create unique key for R2
    const key = `cleaners/${cleanerId}/${Date.now()}-${fileName}`

    const params = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }

    await s3.send(new PutObjectCommand(params))

    // Construct public URL
    const publicUrl =
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${process.env.R2_BUCKET_NAME}`
    const url = `${publicUrl.replace(/\/+$/, "")}/${key}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
