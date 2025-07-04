import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { WithId, Document } from 'mongodb';

// Define TypeScript interfaces for our data with English field names
interface StepData {
  id: number;
  startTime: Date;
  completedTime?: Date;
  elapsedTime?: number;
  photo?: string;
  validationAI?: {
    isValid: boolean;
    analysis: {
      expected: string;
      found: string;
    };
  };
  corrected?: boolean;
  ignored?: boolean;
  photoType?: string;
  failed?: boolean;
  failurePhoto?: string;
}

interface CleaningDocument extends WithId<Document> {
  id: string;
  room: string;
  type?: string;
  startTime: Date;
  endTime: Date;
  steps: StepData[];
  sessionId?: string;
  complete?: boolean;
  reason?: string;
  failed?: boolean;
  failurePhoto?: string;
}

// This route is marked as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const cleanerId = searchParams.get('cleanerId');
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    if (!db) {
      throw new Error('Could not connect to the database');
    }
    
    // Build query
    const query: any = {};
    if (cleanerId) {
      query.cleanerId = cleanerId;
    }
    
    // Fetch cleaning records from the database
    const cleanings = await db.collection<CleaningDocument>('checklistProgress')
      .find(query)
      .sort({ startTime: -1 }) // Sort by most recent first
      .toArray();
    
    // Convert MongoDB _id to string for JSON serialization
    const formattedCleanings = cleanings.map(cleaning => ({
      ...cleaning,
      _id: cleaning._id.toString(),
      // Ensure dates are properly serialized
      startTime: cleaning.startTime ? new Date(cleaning.startTime).toISOString() : null,
      endTime: cleaning.endTime ? new Date(cleaning.endTime).toISOString() : null,
      steps: cleaning.steps?.map((step: StepData) => ({
        ...step,
        startTime: step.startTime ? new Date(step.startTime).toISOString() : null,
        completedTime: step.completedTime ? new Date(step.completedTime).toISOString() : null
      })) || []
    }));

    return NextResponse.json(formattedCleanings);
  } catch (error) {
    console.error('Error fetching cleanings:', error);
    return NextResponse.json(
      { 
        error: 'Error loading cleanings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}