import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// Enable debug logging
const debug = process.env.NODE_ENV !== 'production';
const log = (...args: any[]) => debug && console.log('[checklist-progress]', ...args);
const error = (...args: any[]) => console.error('[checklist-progress]', ...args);

export async function POST(request: Request) {
  log('POST request received');
  try {
    const data = await request.json();
    log('Request data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    const missingFields = [];
    if (!data.id) missingFields.push('id');
    if (!data.habitacion) missingFields.push('habitacion');
    if (!data.tipo) missingFields.push('tipo');
    if (!data.horaInicio) missingFields.push('horaInicio');
    if (!data.pasos) missingFields.push('pasos');
    
    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      error('Validation error:', errorMsg);
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    // Check if session is over 12 hours old
    const startTime = new Date(data.horaInicio);
    const now = new Date();
    const duration = now.getTime() - startTime.getTime();
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    
    // Convert Spanish field names to English and date strings to Date objects
    const progressData = {
      id: data.id,
      room: data.habitacion,
      type: data.tipo,
      cleanerId: data.limpiadorId, // Add cleaner ID
      startTime: startTime,
      endTime: data.horaFin ? new Date(data.horaFin) : (duration > TWELVE_HOURS_MS ? now : undefined),
      steps: data.pasos.map((paso: any) => ({
        ...paso,
        startTime: new Date(paso.horaInicio),
        completedTime: paso.horaCompletado ? new Date(paso.horaCompletado) : undefined,
        elapsedTime: paso.tiempoTranscurrido,
        photo: paso.foto,
        validationAI: paso.validacionIA ? {
          isValid: paso.validacionIA.esValida,
          analysis: {
            expected: paso.validacionIA.analisis.esperaba,
            found: paso.validacionIA.analisis.encontro
          }
        } : undefined,
        corrected: paso.corregido,
        ignored: paso.ignorado,
        photoType: paso.tipoFoto,
        failed: paso.fallado,
        failurePhoto: paso.fotoFalla
      })),
      sessionId: data.sesionId,
      complete: data.completa || false || (duration > TWELVE_HOURS_MS),
      reason: data.razon || (duration > TWELVE_HOURS_MS ? 'Auto-closed: Session exceeded 12 hours' : undefined),
      failed: data.fallado,
      failurePhoto: data.fotoFalla
    };

    log('Saving checklist progress to database...');
    const result = await DatabaseService.saveChecklistProgress(progressData);
    log('Successfully saved checklist progress:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    error('Error saving checklist progress:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' ? { stack: errorStack } : {})
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (id) {
      const progress = await DatabaseService.getChecklistProgress(id);
      if (!progress) {
        return NextResponse.json(
          { error: 'Checklist progress not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(progress);
    }

    if (startDate && endDate) {
      const progressList = await DatabaseService.getChecklistProgressByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
      return NextResponse.json(progressList);
    }

    const allProgress = await DatabaseService.getAllChecklistProgress();
    return NextResponse.json(allProgress);
  } catch (error) {
    console.error('Error fetching checklist progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklist progress' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects in updates
    const updates = { ...data };
    if (updates.horaInicio) updates.horaInicio = new Date(updates.horaInicio);
    if (updates.horaFin) updates.horaFin = new Date(updates.horaFin);
    if (updates.pasos) {
      updates.pasos = updates.pasos.map((paso: any) => ({
        ...paso,
        horaInicio: new Date(paso.horaInicio),
        horaCompletado: paso.horaCompletado ? new Date(paso.horaCompletado) : undefined,
      }));
    }

    const result = await DatabaseService.updateChecklistProgress(data.id, updates);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Checklist progress not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating checklist progress:', error);
    return NextResponse.json(
      { error: 'Failed to update checklist progress' },
      { status: 500 }
    );
  }
}