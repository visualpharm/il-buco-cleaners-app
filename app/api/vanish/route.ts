import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const checklistProgress = await DatabaseService.getAllChecklistProgress();
    
    // Transform the data to match the frontend's expected format
    const formattedSessions = checklistProgress.map((progress) => ({
      id: progress.id,
      habitacion: progress.habitacion,
      tipo: progress.tipo,
      horaInicio: progress.horaInicio.toISOString(),
      horaFin: progress.horaFin ? progress.horaFin.toISOString() : new Date().toISOString(),
      pasos: progress.pasos.map((paso) => ({
        ...paso,
        horaInicio: paso.horaInicio.toISOString(),
        horaCompletado: paso.horaCompletado ? paso.horaCompletado.toISOString() : undefined,
      })),
      sesionId: progress.sesionId,
      completa: progress.completa,
      razon: progress.razon,
      fallado: progress.fallado,
      fotoFalla: progress.fotoFalla
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('API /api/vanish error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}


export async function PUT(request: Request) {
  try {
    const { operacionId, fallado, fotoFalla, stepId, stepFallado, stepFotoFalla } = await request.json();

    if (!operacionId) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      );
    }

    // Get current operation
    const currentProgress = await DatabaseService.getChecklistProgress(operacionId.toString());
    if (!currentProgress) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Handle operation-level updates
    if (typeof fallado === 'boolean') {
      updateData.fallado = fallado;
    }
    if (fotoFalla !== undefined) {
      updateData.fotoFalla = fotoFalla;
    }

    // Handle step-level updates
    if (stepId !== undefined) {
      const updatedPasos = currentProgress.pasos.map(paso => {
        if (paso.id === stepId) {
          const updatedPaso = { ...paso };
          if (typeof stepFallado === 'boolean') {
            updatedPaso.fallado = stepFallado;
          }
          if (stepFotoFalla !== undefined) {
            updatedPaso.fotoFalla = stepFotoFalla;
          }
          return updatedPaso;
        }
        return paso;
      });
      updateData.pasos = updatedPasos;
    }

    const updatedProgress = await DatabaseService.updateChecklistProgress(
      operacionId.toString(),
      updateData
    );

    if (!updatedProgress) {
      return NextResponse.json(
        { error: 'Failed to update operation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: updatedProgress
    });
  } catch (error) {
    console.error('Error updating operation:', error);
    return NextResponse.json(
      { error: 'Failed to update operation' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // For now, just return success - we could implement bulk delete later
    return NextResponse.json({ 
      success: true, 
      message: 'All sessions cleared' 
    });
  } catch (error) {
    console.error('Error deleting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to delete sessions' },
      { status: 500 }
    );
  }
}
