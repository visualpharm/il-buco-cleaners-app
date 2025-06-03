"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DemoTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Create a simple test image as a blob
  const createTestImage = (): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext("2d")!

      // Create a simple gradient background
      const gradient = ctx.createLinearGradient(0, 0, 400, 300)
      gradient.addColorStop(0, "#4F46E5")
      gradient.addColorStop(1, "#7C3AED")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 400, 300)

      // Add some text
      ctx.fillStyle = "white"
      ctx.font = "24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Demo Test Image", 200, 150)
      ctx.font = "16px Arial"
      ctx.fillText(new Date().toLocaleString(), 200, 180)

      canvas.toBlob(
        (blob) => {
          resolve(blob!)
        },
        "image/jpeg",
        0.8,
      )
    })
  }

  const runDemoTest = async () => {
    setIsRunning(true)
    setError(null)
    setResults([])

    try {
      // Step 1: Create a test image
      setResults((prev) => [...prev, { step: "Creating test image...", status: "running" }])

      const imageBlob = await createTestImage()
      setResults((prev) =>
        prev.map((r) =>
          r.step === "Creating test image..."
            ? { ...r, status: "success", details: `Created ${Math.round(imageBlob.size / 1024)}KB test image` }
            : r,
        ),
      )

      // Step 2: Upload the image to R2 storage
      setResults((prev) => [...prev, { step: "Uploading image to R2 storage...", status: "running" }])

      const formData = new FormData()
      formData.append("file", imageBlob, "demo-test-image.jpg")

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(`R2 upload failed: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ""}`)
      }

      const uploadData = await uploadResponse.json()

      setResults((prev) =>
        prev.map((r) =>
          r.step === "Uploading image to R2 storage..."
            ? {
                ...r,
                status: "success",
                details: `Image uploaded to R2 as ${uploadData.filename}`,
                url: uploadData.url,
              }
            : r,
        ),
      )

      // Step 3: Create D1 demo session
      setResults((prev) => [...prev, { step: "Creating D1 demo session...", status: "running" }])

      const sessionData = {
        room_type: "habitacion",
        photo_url: uploadData.url,
      }

      const sessionResponse = await fetch("/api/demo-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      })

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text()
        throw new Error(`D1 session creation failed: ${errorText}`)
      }

      const sessionResult = await sessionResponse.json()
      setResults((prev) =>
        prev.map((r) =>
          r.step === "Creating D1 demo session..."
            ? { ...r, status: "success", details: `${sessionResult.message} - ID: ${sessionResult.sessionId}` }
            : r,
        ),
      )

      // Step 4: Verify D1 data
      setResults((prev) => [...prev, { step: "Verifying D1 stored data...", status: "running" }])

      const verifyResponse = await fetch("/api/demo-session")
      if (!verifyResponse.ok) throw new Error("Failed to verify D1 data")

      const verifyData = await verifyResponse.json()
      setResults((prev) =>
        prev.map((r) =>
          r.step === "Verifying D1 stored data..."
            ? {
                ...r,
                status: "success",
                details: `${verifyData.message} - Found ${verifyData.count} sessions`,
              }
            : r,
        ),
      )

      setResults((prev) => [
        ...prev,
        {
          step: "✅ Demo test completed successfully!",
          status: "success",
          details: `Session ID: ${sessionResult.sessionId} stored in D1 with R2 image`,
        },
      ])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      setResults((prev) => [...prev, { step: "❌ Test failed", status: "error", details: errorMessage }])
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Demo Test - R2 Upload & D1 Database</CardTitle>
            <p className="text-gray-600">
              This test will create a test image, upload it to Cloudflare R2 storage, and create a cleaning session
              record in the D1 database.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runDemoTest} disabled={isRunning} className="w-full">
              {isRunning ? "Running Test..." : "Run Demo Test"}
            </Button>

            {error && (
              <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                <h3 className="font-semibold text-red-800">Error:</h3>
                <p className="text-red-700 mb-2">{error}</p>
                <details className="text-sm text-red-600">
                  <summary className="cursor-pointer font-medium">Troubleshooting</summary>
                  <div className="mt-2 space-y-2">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                      <strong>R2 Storage:</strong>
                      <ul className="list-disc list-inside mt-1">
                        <li>Check if R2 environment variables are configured</li>
                        <li>Verify bucket permissions and CORS settings</li>
                        <li>Ensure public URL is accessible</li>
                      </ul>
                    </div>
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                      <strong>D1 Database:</strong>
                      <ul className="list-disc list-inside mt-1">
                        <li>Verify D1 database binding is configured</li>
                        <li>Check if tables exist in D1 console</li>
                      </ul>
                    </div>
                  </div>
                </details>
              </div>
            )}

            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={
                        result.status === "success"
                          ? "default"
                          : result.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {result.status === "running" ? "⏳" : result.status === "success" ? "✅" : "❌"}
                    </Badge>
                    <span className="font-medium">{result.step}</span>
                  </div>
                  {result.details && <span className="text-sm text-gray-600">{result.details}</span>}
                </div>
              ))}
            </div>

            {results.some((r) => r.url) && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Uploaded Image:</h3>
                <img
                  src={results.find((r) => r.url)?.url || "/placeholder.svg"}
                  alt="Demo uploaded image"
                  className="max-w-full h-auto rounded-lg border"
                />
                <p className="text-sm text-gray-500 mt-2">Stored in Cloudflare R2</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
