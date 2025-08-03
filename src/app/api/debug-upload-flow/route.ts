import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🔍 [Debug Upload Flow] Testing complete upload flow...');
    
    // Test the AI flow directly
    const { studyUploadFlow } = await import('@/ai/flows/study-upload-flow');
    
    const testInput = {
      videoDataUri: 'https://example.com/test-video.mp4',
      patientName: 'Test Patient Flow',
      requestingDoctorName: 'Dr. Test Flow',
      description: 'Test upload flow description'
    };
    
    console.log('🔍 [Debug Upload Flow] Calling studyUploadFlow...');
    const result = await studyUploadFlow(testInput);
    console.log('✅ [Debug Upload Flow] studyUploadFlow completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Upload flow working',
      flowResult: result
    });
    
  } catch (error) {
    console.error('❌ [Debug Upload Flow] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'upload_flow'
    }, { status: 500 });
  }
}