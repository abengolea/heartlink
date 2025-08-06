import { NextResponse } from 'next/server';
import { uploadStudy } from '@/actions/upload-study';

export async function POST(request: Request) {
  console.log('🧪 [TEST-REAL-UPLOAD] Starting test with real form data...');
  
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    console.log('🧪 [TEST-REAL-UPLOAD] Received FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`🧪   ${key}: ${value}`);
    }
    
    console.log('🧪 [TEST-REAL-UPLOAD] About to call uploadStudy server action...');
    
    const result = await uploadStudy(null, formData);
    
    console.log('🧪 [TEST-REAL-UPLOAD] Server action completed!');
    console.log('🧪 [TEST-REAL-UPLOAD] Result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Test real upload completed successfully',
      result: result,
      formDataReceived: Object.fromEntries(formData.entries()),
      logs: 'Check server console for detailed logs'
    });
    
  } catch (error) {
    console.error('🧪 [TEST-REAL-UPLOAD] EXCEPTION:', error);
    console.error('🧪 [TEST-REAL-UPLOAD] Error type:', typeof error);
    console.error('🧪 [TEST-REAL-UPLOAD] Error constructor:', error?.constructor?.name);
    console.error('🧪 [TEST-REAL-UPLOAD] Error message:', error?.message);
    console.error('🧪 [TEST-REAL-UPLOAD] Error stack:', error?.stack);
    
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