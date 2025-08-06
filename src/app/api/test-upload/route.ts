import { NextResponse } from 'next/server';
import { uploadStudy } from '@/actions/upload-study';

export async function POST(request: Request) {
  console.log('🧪 [TEST-UPLOAD] Starting test upload...');
  
  try {
    // Create test FormData
    const formData = new FormData();
    formData.append('patientName', 'Test Patient');
    formData.append('requestingDoctorName', 'Dr. Test');
    formData.append('description', 'Test upload from API endpoint');
    formData.append('filePath', 'studies/test-video.mp4');
    
    console.log('🧪 [TEST-UPLOAD] Created FormData with test values');
    console.log('🧪 [TEST-UPLOAD] FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`🧪   ${key}: ${value}`);
    }
    
    console.log('🧪 [TEST-UPLOAD] About to call uploadStudy server action...');
    
    const result = await uploadStudy(null, formData);
    
    console.log('🧪 [TEST-UPLOAD] Server action completed!');
    console.log('🧪 [TEST-UPLOAD] Result:', result);
    console.log('🧪 [TEST-UPLOAD] Result type:', typeof result);
    console.log('🧪 [TEST-UPLOAD] Result keys:', Object.keys(result || {}));
    
    return NextResponse.json({
      success: true,
      message: 'Test upload completed successfully',
      result: result,
      logs: 'Check server console for detailed logs'
    });
    
  } catch (error) {
    console.error('🧪 [TEST-UPLOAD] EXCEPTION:', error);
    console.error('🧪 [TEST-UPLOAD] Error type:', typeof error);
    console.error('🧪 [TEST-UPLOAD] Error constructor:', error?.constructor?.name);
    console.error('🧪 [TEST-UPLOAD] Error message:', error?.message);
    console.error('🧪 [TEST-UPLOAD] Error stack:', error?.stack);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorStack: error?.stack,
      logs: 'Check server console for detailed error logs'
    }, { status: 500 });
  }
}

export async function GET() {
  return POST(new Request('http://localhost', { method: 'POST' }));
}