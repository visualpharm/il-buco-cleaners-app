import { NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import r2Config from "@/config/r2.config"

// Initialize S3 client with explicit configuration to avoid filesystem access
const s3Client = new S3Client({
  region: "auto",
  endpoint: r2Config.endpoint,
  credentials: {
    accessKeyId: r2Config.accessKeyId || "",
    secretAccessKey: r2Config.secretAccessKey || "",
  },
  // Disable loading credentials from shared files
  credentialDefaultProvider: () => () =>
    Promise.resolve({
      accessKeyId: r2Config.accessKeyId || "",
      secretAccessKey: r2Config.secretAccessKey || "",
    }),
  // Disable loading config from shared files
  loadedConfig: {
    loadedFrom: "explicit",
    configFilepath: "",
    credentialsFilepath: "",
    profiles: {},
  },
  // Disable loading shared config files
  loadedConfigSelectors: {
    configFilepath: () => "",
    credentialsFilepath: () => "",
    profile: () => "",
  },
})

export async function GET() {
  try {
    // List objects in the R2 bucket
    const command = new ListObjectsV2Command({
      Bucket: r2Config.bucketName,
    })

    const response = await s3Client.send(command)

    if (!response.Contents) {
      return NextResponse.json({ photos: [] })
    }

    // Create public URLs for each photo
    const photos = response.Contents.filter((item) => item.Key && item.LastModified) // Filter out any undefined items
      .map((item) => ({
        key: item.Key!,
        lastModified: item.LastModified!.toISOString(),
        size: item.Size || 0,
        url: `${r2Config.publicBaseUrl}/${encodeURIComponent(item.Key!)}`,
      }))

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Error listing photos:", error)
    return NextResponse.json(
      { error: "Error al listar las fotos", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
