import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Convert file to base64 data URL for local storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = file.type || "image/jpeg"
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Return the data URL which can be used directly in img src
    return NextResponse.json({ url: dataUrl })
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
