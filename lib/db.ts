// Database interface - in a real implementation, this would connect to a database like PostgreSQL, MySQL, or MongoDB
// For this example, I'll create a structure that can easily be adapted to any database

export interface LimpiezaDB {
  id: number
  habitacion: string
  tipo: string
  horaInicio: string // ISO string
  horaFin: string // ISO string
  pasos: StepDataDB[]
  sesionId?: string
  completa: boolean
  razon?: string
  createdAt: string
  updatedAt: string
}

export interface StepDataDB {
  id: number
  horaInicio: string // ISO string
  horaCompletado?: string // ISO string
  tiempoTranscurrido?: number
  foto?: string
  validacionIA?: {
    esValida: boolean
    analisis: {
      esperaba: string
      encontro: string
    }
  }
  corregido?: boolean
  ignorado?: boolean
  tipoFoto?: string
}

// Simulated database operations
// In production, replace these with actual database calls
class DatabaseService {
  private static instance: DatabaseService
  private limpiezas: LimpiezaDB[] = []

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async getAllLimpiezas(): Promise<LimpiezaDB[]> {
    // In production: SELECT * FROM limpiezas ORDER BY horaInicio DESC
    return [...this.limpiezas].sort((a, b) => new Date(b.horaInicio).getTime() - new Date(a.horaInicio).getTime())
  }

  async getLimpiezaById(id: number): Promise<LimpiezaDB | null> {
    // In production: SELECT * FROM limpiezas WHERE id = ?
    return this.limpiezas.find((l) => l.id === id) || null
  }

  async createLimpieza(limpieza: Omit<LimpiezaDB, "id" | "createdAt" | "updatedAt">): Promise<LimpiezaDB> {
    // In production: INSERT INTO limpiezas (...) VALUES (...) RETURNING *
    const newLimpieza: LimpiezaDB = {
      ...limpieza,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.limpiezas.push(newLimpieza)
    return newLimpieza
  }

  async updateLimpieza(id: number, updates: Partial<LimpiezaDB>): Promise<LimpiezaDB | null> {
    // In production: UPDATE limpiezas SET ... WHERE id = ? RETURNING *
    const index = this.limpiezas.findIndex((l) => l.id === id)
    if (index === -1) return null

    this.limpiezas[index] = {
      ...this.limpiezas[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    return this.limpiezas[index]
  }

  async deleteLimpieza(id: number): Promise<boolean> {
    // In production: DELETE FROM limpiezas WHERE id = ?
    const index = this.limpiezas.findIndex((l) => l.id === id)
    if (index === -1) return false

    this.limpiezas.splice(index, 1)
    return true
  }
}

export const db = DatabaseService.getInstance()
