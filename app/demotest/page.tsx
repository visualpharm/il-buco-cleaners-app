"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DemoTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const runDemoTest = async () => {
    setIsRunning(true)
    setError(null)
    setResults([])

    try {
      // Step 1: Generate a random image from picsum.photos
      setResults((prev) => [...prev, { step: "Downloading random image...", status: "running" }])

      const imageResponse = await fetch("https://picsum.photos/400/300")
      if (!imageResponse.ok) throw new Error("Failed to fetch random image")

      const imageBlob = await imageResponse.blob()
      setResults((prev) =>
        prev.map((r) =>
          r.step === "Downloading random image..."
            ? { ...r, status: "success", details: `Downloaded ${Math.round(imageBlob.size / 1024)}KB image` }
            : r,
        ),
      )

      // Step 2: Upload the image
      setResults((prev) => [...prev, { step: "Uploading image to server...", status: "running" }])

      const formData = new FormData()
      formData.append("file", imageBlob, "demo-image.jpg")

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(`Upload failed: ${errorData.error}`)
      }

      const uploadData = await uploadResponse.json()
      setResults((prev) =>
        prev.map((r) =>
          r.step === "Uploading image to server..."
            ? { ...r, status: "success", details: "Image uploaded successfully", url: uploadData.url }
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
          step: "✅ D1 Demo test completed successfully!",
          status: "success",
          details: `Session ID: ${sessionResult.sessionId} stored in D1 simulation`,
        },
      ])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      let detailedError = errorMessage

      // Add more specific D1 error information
      if (errorMessage.includes("Failed to execute 'json'")) {
        detailedError = `API returned non-JSON response. Check if D1 database binding is configured correctly.`
      } else if (errorMessage.includes("D1 session creation failed")) {
        detailedError = `${errorMessage}. Check D1 database connection and table structure.`
      }

      setError(detailedError)
      setResults((prev) => [...prev, { step: "❌ Test failed", status: "error", details: detailedError }])
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Demo Test - Upload & Database</CardTitle>
            <p className="text-gray-600">
              This test will automatically download a random image, upload it to the server, and create a cleaning
              session record in the database.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runDemoTest} disabled={isRunning} className="w-full">
              {isRunning ? "Running Test..." : "Run Demo Test"}
            </Button>

            {error && (
              <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                <h3 className="font-semibold text-red-800">D1 Database Error:</h3>
                <p className="text-red-700 mb-2">{error}</p>
                <details className="text-sm text-red-600">
                  <summary className="cursor-pointer font-medium">D1 Troubleshooting</summary>
                  <div className="mt-2 space-y-2">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                      <strong>Your D1 Database:</strong>
                      <ul className="list-disc list-inside mt-1">
                        <li>Database: ilbuco-cleaning-db</li>
                        <li>ID: be8ebe7e-08ff-4db0-b386-21a989302bea</li>
                        <li>Check if tables exist in D1 console</li>
                        <li>Verify Cloudflare Workers binding is configured</li>
                      </ul>
                    </div>
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <strong>Note:</strong> This demo simulates D1 operations using localStorage for testing purposes.
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
