import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { WithId, Document } from 'mongodb';

// Define TypeScript interfaces for our data
interface StepData {
  id: number;
  horaInicio: Date;
  horaCompletado?: Date;
  tiempoTranscurrido?: number;
  foto?: string;
  validacionIA?: {
    esValida: boolean;
    analisis: {
      esperaba: string;
      encontro: string;
    };
  };
  corregido?: boolean;
  ignorado?: boolean;
  tipoFoto?: string;
  fallado?: boolean;
  fotoFalla?: string;
}

interface LimpiezaDocument extends WithId<Document> {
  id: number;
  habitacion: string;
  tipo?: string;
  horaInicio: Date;
  horaFin: Date;
  pasos: StepData[];
  sesionId?: string;
  completa?: boolean;
  razon?: string;
  fallado?: boolean;
  fotoFalla?: string;
}

// This route is marked as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    if (!db) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    // Fetch all cleaning records from the database
    const limpiezas = await db.collection<LimpiezaDocument>('limpiezas')
      .find({})
      .sort({ horaInicio: -1 }) // Sort by most recent first
      .toArray();
    
    // Convert MongoDB _id to string for JSON serialization
    const formattedLimpiezas = limpiezas.map(limpieza => ({
      ...limpieza,
      _id: limpieza._id.toString(),
      // Ensure dates are properly serialized
      horaInicio: limpieza.horaInicio ? new Date(limpieza.horaInicio).toISOString() : null,
      horaFin: limpieza.horaFin ? new Date(limpieza.horaFin).toISOString() : null,
      pasos: limpieza.pasos?.map((paso: StepData) => ({
        ...paso,
        horaInicio: paso.horaInicio ? new Date(paso.horaInicio).toISOString() : null,
        horaCompletado: paso.horaCompletado ? new Date(paso.horaCompletado).toISOString() : null
      })) || []
    }));

    return NextResponse.json(formattedLimpiezas);
  } catch (error) {
    console.error('Error fetching limpiezas:', error);
    return NextResponse.json(
      { 
        error: 'Error al cargar las limpiezas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
