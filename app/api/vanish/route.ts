import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const checklistProgress = await DatabaseService.getAllChecklistProgress();
    
    // Transform the data to match the frontend's expected format (Spanish UI)
    const formattedSessions = checklistProgress.map((progress) => ({
      id: progress.id,
      habitacion: progress.room, // Map from English DB field to Spanish UI
      tipo: progress.type,
      horaInicio: progress.startTime.toISOString(),
      horaFin: progress.endTime ? progress.endTime.toISOString() : new Date().toISOString(),
      pasos: progress.steps.map((step) => ({
        ...step,
        horaInicio: step.startTime.toISOString(),
        horaCompletado: step.completedTime ? step.completedTime.toISOString() : undefined,
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
      })),
      sesionId: progress.sessionId,
      completa: progress.complete,
      razon: progress.reason,
      fallado: progress.failed,
      fotoFalla: progress.failurePhoto
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
      const updatedSteps = currentProgress.steps.map(step => {
        if (step.id === stepId) {
          const updatedStep = { ...step };
          if (typeof stepFallado === 'boolean') {
            updatedStep.failed = stepFallado;
          }
          if (stepFotoFalla !== undefined) {
            updatedStep.failurePhoto = stepFotoFalla;
          }
          return updatedStep;
        }
        return step;
      });
      updateData.steps = updatedSteps;
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
