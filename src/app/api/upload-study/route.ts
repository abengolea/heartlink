import { NextResponse } from 'next/server';
import { uploadStudy } from '@/actions/upload-study';

export async function POST(request: Request) {
  console.log('🔍 [UPLOAD-STUDY] Starting upload study via endpoint...');
  
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    console.log('🔍 [UPLOAD-STUDY] Received FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`🔍   ${key}: ${value}`);
    }
    
    console.log('🔍 [UPLOAD-STUDY] About to call uploadStudy server action...');
    
    const result = await uploadStudy(null, formData);
    
    console.log('✅ [UPLOAD-STUDY] Server action completed!');
    console.log('✅ [UPLOAD-STUDY] Result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Upload study completed successfully',
      result: result,
      formDataReceived: Object.fromEntries(formData.entries()),
      logs: 'Check server console for detailed logs'
    });
    
  } catch (error) {
    console.error('❌ [UPLOAD-STUDY] EXCEPTION:', error);
    console.error('❌ [UPLOAD-STUDY] Error type:', typeof error);
    console.error('❌ [UPLOAD-STUDY] Error constructor:', error?.constructor?.name);
    console.error('❌ [UPLOAD-STUDY] Error message:', error?.message);
    console.error('❌ [UPLOAD-STUDY] Error stack:', error?.stack);
    
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