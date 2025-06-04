import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.habitacion || !data.tipo || !data.horaInicio || !data.pasos) {
      return NextResponse.json(
        { error: 'Missing required fields: id, habitacion, tipo, horaInicio, pasos' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const progressData = {
      ...data,
      horaInicio: new Date(data.horaInicio),
      horaFin: data.horaFin ? new Date(data.horaFin) : undefined,
      pasos: data.pasos.map((paso: any) => ({
        ...paso,
        horaInicio: new Date(paso.horaInicio),
        horaCompletado: paso.horaCompletado ? new Date(paso.horaCompletado) : undefined,
      })),
    };

    const result = await DatabaseService.saveChecklistProgress(progressData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving checklist progress:', error);
    return NextResponse.json(
      { error: 'Failed to save checklist progress' },
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