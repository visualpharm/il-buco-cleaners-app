import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const limpieza = await db.getLimpiezaById(id)

    if (!limpieza) {
      return NextResponse.json({ error: "Limpieza not found" }, { status: 404 })
    }

    return NextResponse.json(limpieza)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch limpieza" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()
    const limpieza = await db.updateLimpieza(id, body)

    if (!limpieza) {
      return NextResponse.json({ error: "Limpieza not found" }, { status: 404 })
    }

    return NextResponse.json(limpieza)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update limpieza" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const success = await db.deleteLimpieza(id)

    if (!success) {
      return NextResponse.json({ error: "Limpieza not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete limpieza" }, { status: 500 })
  }
}
