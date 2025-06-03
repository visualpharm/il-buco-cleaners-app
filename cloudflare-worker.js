// Cloudflare Worker for Il Buco Cleaning App
// This handles D1 database operations and R2 storage

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS handling for preflight requests
    if (request.method === "OPTIONS") {
      return handleCors()
    }

    // API routes
    if (path.startsWith("/api/")) {
      // Add CORS headers to all API responses
      const response = await handleApiRequest(request, env)
      return addCorsHeaders(response)
    }

    // Return 404 for unknown routes
    return new Response("Not found", { status: 404 })
  },
}

// Handle API requests
async function handleApiRequest(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  // Sessions API
  if (path === "/api/sessions" && request.method === "POST") {
    return handleCreateSession(request, env)
  }

  if (path === "/api/sessions" && request.method === "GET") {
    return handleGetSessions(request, env)
  }

  if (path.match(/^\/api\/sessions\/[\w-]+$/) && request.method === "GET") {
    const sessionId = path.split("/").pop()
    return handleGetSession(request, env, sessionId)
  }

  if (path.match(/^\/api\/sessions\/[\w-]+$/) && request.method === "PUT") {
    const sessionId = path.split("/").pop()
    return handleUpdateSession(request, env, sessionId)
  }

  // Upload API
  if (path === "/api/upload-image" && request.method === "POST") {
    return handleImageUpload(request, env)
  }

  // Demo test API
  if (path === "/api/demo-session" && request.method === "POST") {
    return handleDemoSession(request, env)
  }

  if (path === "/api/demo-session" && request.method === "GET") {
    return handleGetDemoSessions(request, env)
  }

  // Return 404 for unknown API routes
  return new Response(JSON.stringify({ error: "API route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  })
}

// Create a new cleaning session
async function handleCreateSession(request, env) {
  try {
    const { room_type, checklist_items } = await request.json()

    // Generate a unique ID for the session
    const sessionId = crypto.randomUUID()

    // Start a D1 transaction
    const stmt = env.DB.prepare("INSERT INTO cleaning_sessions (id, room_type) VALUES (?, ?)").bind(
      sessionId,
      room_type,
    )

    await stmt.run()

    // Insert checklist items
    for (const item of checklist_items) {
      await env.DB.prepare(
        "INSERT INTO checklist_items (session_id, item_id, category, text, is_completed) VALUES (?, ?, ?, ?, ?)",
      )
        .bind(sessionId, item.id, item.categoria, item.texto, false)
        .run()
    }

    return new Response(JSON.stringify({ success: true, sessionId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return new Response(JSON.stringify({ error: "Failed to create session", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Get all cleaning sessions
async function handleGetSessions(request, env) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT cs.*, 
        (SELECT json_group_array(json_object(
          'id', ci.id,
          'item_id', ci.item_id,
          'category', ci.category,
          'text', ci.text,
          'is_completed', ci.is_completed,
          'completed_at', ci.completed_at
        ))
        FROM checklist_items ci
        WHERE ci.session_id = cs.id) as checklist_items,
        (SELECT json_group_array(json_object(
          'id', p.id,
          'item_id', p.item_id,
          'photo_url', p.photo_url,
          'uploaded_at', p.uploaded_at
        ))
        FROM photos p
        WHERE p.session_id = cs.id) as photos
      FROM cleaning_sessions cs
      ORDER BY cs.started_at DESC
    `).all()

    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch sessions", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Get a specific cleaning session
async function handleGetSession(request, env, sessionId) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT cs.*, 
        (SELECT json_group_array(json_object(
          'id', ci.id,
          'item_id', ci.item_id,
          'category', ci.category,
          'text', ci.text,
          'is_completed', ci.is_completed,
          'completed_at', ci.completed_at
        ))
        FROM checklist_items ci
        WHERE ci.session_id = cs.id) as checklist_items,
        (SELECT json_group_array(json_object(
          'id', p.id,
          'item_id', p.item_id,
          'photo_url', p.photo_url,
          'uploaded_at', p.uploaded_at
        ))
        FROM photos p
        WHERE p.session_id = cs.id) as photos
      FROM cleaning_sessions cs
      WHERE cs.id = ?
    `)
      .bind(sessionId)
      .all()

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify(results[0]), { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("Error fetching session:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch session", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Update a cleaning session
async function handleUpdateSession(request, env, sessionId) {
  try {
    const { itemId, isCompleted, photoUrl } = await request.json()

    // Update checklist item status
    await env.DB.prepare(
      `UPDATE checklist_items 
       SET is_completed = ?, completed_at = ?
       WHERE session_id = ? AND item_id = ?`,
    )
      .bind(isCompleted ? 1 : 0, isCompleted ? new Date().toISOString() : null, sessionId, itemId)
      .run()

    // If there's a photo URL, save it
    if (photoUrl) {
      await env.DB.prepare(
        `INSERT INTO photos (session_id, item_id, photo_url)
         VALUES (?, ?, ?)`,
      )
        .bind(sessionId, itemId, photoUrl)
        .run()
    }

    // If marking as complete, check if all items are complete
    if (isCompleted) {
      const { results } = await env.DB.prepare(
        `SELECT COUNT(*) as total, 
                SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
         FROM checklist_items 
         WHERE session_id = ?`,
      )
        .bind(sessionId)
        .all()

      const { total, completed } = results[0]

      if (Number.parseInt(total) === Number.parseInt(completed)) {
        await env.DB.prepare(
          `UPDATE cleaning_sessions 
           SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
        )
          .bind(sessionId)
          .run()
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("Error updating session:", error)
    return new Response(JSON.stringify({ error: "Failed to update session", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Handle image upload to R2
async function handleImageUpload(request, env) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const filename = `uploads/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

    // Upload to R2
    await env.BUCKET.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    })

    // Generate public URL
    const publicUrl = `${env.PUBLIC_R2_URL}/${filename}`

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return new Response(
      JSON.stringify({
        error: "Upload failed",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

// Handle demo session creation
async function handleDemoSession(request, env) {
  try {
    const { room_type, photo_url } = await request.json()

    // Generate a unique ID for the session
    const sessionId = crypto.randomUUID()

    // Insert into D1
    await env.DB.prepare(
      "INSERT INTO cleaning_sessions (id, room_type, status, completed_at) VALUES (?, ?, 'completed', CURRENT_TIMESTAMP)",
    )
      .bind(sessionId, room_type)
      .run()

    // Insert a demo checklist item
    await env.DB.prepare(
      "INSERT INTO checklist_items (session_id, item_id, category, text, is_completed, completed_at) VALUES (?, 1, 'Demo Test', 'Demo cleaning step with photo validation', 1, CURRENT_TIMESTAMP)",
    )
      .bind(sessionId)
      .run()

    // Insert the photo
    if (photo_url) {
      await env.DB.prepare("INSERT INTO photos (session_id, item_id, photo_url) VALUES (?, 1, ?)")
        .bind(sessionId, photo_url)
        .run()
    }

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        message: "Demo session created in D1",
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Demo session creation error:", error)
    return new Response(JSON.stringify({ error: "Failed to create demo session", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Get demo sessions
async function handleGetDemoSessions(request, env) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT cs.*, 
        (SELECT json_group_array(json_object(
          'id', ci.id,
          'item_id', ci.item_id,
          'category', ci.category,
          'text', ci.text,
          'is_completed', ci.is_completed,
          'completed_at', ci.completed_at
        ))
        FROM checklist_items ci
        WHERE ci.session_id = cs.id) as checklist_items,
        (SELECT json_group_array(json_object(
          'id', p.id,
          'item_id', p.item_id,
          'photo_url', p.photo_url,
          'uploaded_at', p.uploaded_at
        ))
        FROM photos p
        WHERE p.session_id = cs.id) as photos
      FROM cleaning_sessions cs
      ORDER BY cs.started_at DESC
      LIMIT 10
    `).all()

    return new Response(
      JSON.stringify({
        success: true,
        sessions: results,
        count: results.length,
        message: "Demo sessions retrieved from D1",
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Demo session fetch error:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch demo sessions", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Add CORS headers to a response
function addCorsHeaders(response) {
  const headers = new Headers(response.headers)
  headers.set("Access-Control-Allow-Origin", "*")
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// Handle CORS preflight requests
function handleCors() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
