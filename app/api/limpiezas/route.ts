import { NextResponse } from 'next/server';

// This route is marked as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Redirect to the new cleanings endpoint
export async function GET() {
  try {
    // Fetch from the new cleanings endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cleanings`);
    const data = await response.json();
    
    // Transform English field names back to Spanish for backward compatibility
    const transformedData = data.map((cleaning: any) => ({
      ...cleaning,
      habitacion: cleaning.room,
      tipo: cleaning.type,
      horaInicio: cleaning.startTime,
      horaFin: cleaning.endTime,
      pasos: cleaning.steps?.map((step: any) => ({
        ...step,
        horaInicio: step.startTime,
        horaCompletado: step.completedTime,
        tiempoTranscurrido: step.elapsedTime,
        foto: step.photo,
        validacionIA: step.validationAI ? {
          esValida: step.validationAI.isValid,
          analisis: {
            esperaba: step.validationAI.analysis.expected,
            encontro: step.validationAI.analysis.found
          }
        } : undefined,
        corregido: step.corrected,
        ignorado: step.ignored,
        tipoFoto: step.photoType,
        fallado: step.failed,
        fotoFalla: step.failurePhoto
      })) || [],
      sesionId: cleaning.sessionId,
      completa: cleaning.complete,
      razon: cleaning.reason,
      fallado: cleaning.failed,
      fotoFalla: cleaning.failurePhoto
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching cleanings:', error);
    return NextResponse.json(
      { 
        error: 'Error al cargar las limpiezas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
