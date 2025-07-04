import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function PUT(request: Request) {
  try {
    const { operationId, stepId, failed, photoUrl } = await request.json();

    if (!operationId || stepId === undefined) {
      return NextResponse.json(
        { error: 'Operation ID and Step ID are required' },
        { status: 400 }
      );
    }

    // Get current operation
    const currentProgress = await DatabaseService.getChecklistProgress(operationId.toString());
    if (!currentProgress) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    // Update the specific step
    const updatedSteps = currentProgress.steps.map(step => {
      if (step.id === stepId) {
        const updatedStep = { ...step };
        updatedStep.failed = failed;
        // If photoUrl is provided, update it; if undefined and failed is false, remove it
        if (photoUrl !== undefined) {
          updatedStep.failurePhoto = photoUrl;
        } else if (!failed) {
          updatedStep.failurePhoto = undefined;
        }
        return updatedStep;
      }
      return step;
    });

    const updatedProgress = await DatabaseService.updateChecklistProgress(
      operationId.toString(),
      { steps: updatedSteps }
    );

    if (!updatedProgress) {
      return NextResponse.json(
        { error: 'Failed to update step' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: updatedProgress
    });
  } catch (error) {
    console.error('Error updating step:', error);
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 }
    );
  }
}