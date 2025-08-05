import { NextResponse } from 'next/server';
import { studyUploadFlow } from '@/ai/flows/study-upload-flow';

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    console.log('🔍 [Debug Study Flow] Testing complete study creation flow...');
    
    const testInput = {
      videoDataUri: 'https://storage.googleapis.com/heartlink-f4ftq.firebasestorage.app/studies/test-video.mp4',
      patientName: 'Test Patient Debug',
      requestingDoctorName: 'Dr. Test Debug',
      description: 'Test study creation flow'
    };
    
    console.log('🔍 [Debug Study Flow] Input:', testInput);
    
    // Test the complete flow
    const result = await studyUploadFlow(testInput);
    console.log('✅ [Debug Study Flow] Flow completed successfully:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Study flow working correctly',
      result: result,
      studyId: result.studyId,
      patientId: result.patientId
    });
    
  } catch (error) {
    console.error('❌ [Debug Study Flow] Error:', error);
    
    // More detailed error information
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    return NextResponse.json({
      success: false,
      error: errorDetails.message,
      errorName: errorDetails.name,
      fullError: errorDetails,
      step: 'study_creation_flow'
    }, { status: 500 });
  }
}