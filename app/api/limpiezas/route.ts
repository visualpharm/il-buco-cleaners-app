import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const limpiezas = await db.getAllLimpiezas()
    return NextResponse.json(limpiezas)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch limpiezas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const limpieza = await db.createLimpieza(body)
    return NextResponse.json(limpieza, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create limpieza" }, { status: 500 })
  }
}
