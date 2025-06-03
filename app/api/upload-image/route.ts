import { NextResponse } from "next/server"
import crypto from "crypto"

// Direct R2 upload using fetch instead of AWS SDK
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop() || "jpg"
    const filename = `uploads/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get R2 credentials from environment variables
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID
    const bucketName = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL

    if (!accessKeyId || !secretAccessKey || !accountId || !bucketName) {
      throw new Error("R2 credentials not configured")
    }

    // Direct upload to R2 using Cloudflare's API
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${filename}`

    const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "")
    const dateStamp = date.slice(0, 8)
    const amzDate = date

    // Create canonical request
    const method = "PUT"
    const canonicalUri = `/${bucketName}/${filename}`
    const canonicalQueryString = ""
    const canonicalHeaders =
      `content-type:${file.type || "application/octet-stream"}\n` +
      `host:${accountId}.r2.cloudflarestorage.com\n` +
      `x-amz-content-sha256:${crypto.createHash("sha256").update(buffer).digest("hex")}\n` +
      `x-amz-date:${amzDate}\n`
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date"
    const payloadHash = crypto.createHash("sha256").update(buffer).digest("hex")
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n")

    // Create string to sign
    const algorithm = "AWS4-HMAC-SHA256"
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n")

    // Calculate signature
    const getSignatureKey = (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = crypto
        .createHmac("sha256", "AWS4" + key)
        .update(dateStamp)
        .digest()
      const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest()
      const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest()
      const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest()
      return kSigning
    }

    const signingKey = getSignatureKey(secretAccessKey, dateStamp, "auto", "s3")
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex")

    // Create authorization header
    const authorizationHeader =
      `${algorithm} ` +
      `Credential=${accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, ` +
      `Signature=${signature}`

    // Upload to R2
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "X-Amz-Content-Sha256": payloadHash,
        "X-Amz-Date": amzDate,
        Authorization: authorizationHeader,
      },
      body: buffer,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`R2 upload failed: ${response.status} ${errorText}`)
    }

    // Generate public URL
    const imageUrl = `${publicUrl}/${filename}`

    return NextResponse.json({
      success: true,
      url: imageUrl,
      storage: "r2",
      filename,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "R2 upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
