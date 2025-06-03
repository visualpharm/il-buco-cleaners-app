import { NextResponse } from "next/server"

// Simple D1 database operations for demo
export async function POST(request: Request) {
  try {
    const { room_type, photo_url } = await request.json()

    // For demo purposes, we'll simulate D1 operations
    // In a real Cloudflare Worker, you'd have access to env.DB

    // Simulate creating a session
    const sessionId = Date.now().toString()
    const sessionData = {
      id: sessionId,
      room_type,
      photo_url,
      created_at: new Date().toISOString(),
      status: "completed",
    }

    // Store in localStorage for demo (in real app this would be D1)
    if (typeof window !== "undefined") {
      const sessions = JSON.parse(localStorage.getItem("d1_demo_sessions") || "[]")
      sessions.push(sessionData)
      localStorage.setItem("d1_demo_sessions", JSON.stringify(sessions))
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Demo session created (simulating D1 storage)",
    })
  } catch (error) {
    console.error("Demo session creation error:", error)
    return NextResponse.json({ error: "Failed to create demo session" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Simulate fetching from D1
    let sessions = []

    if (typeof window !== "undefined") {
      sessions = JSON.parse(localStorage.getItem("d1_demo_sessions") || "[]")
    }

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
      message: "Demo sessions retrieved (simulating D1 fetch)",
    })
  } catch (error) {
    console.error("Demo session fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch demo sessions" }, { status: 500 })
  }
}
