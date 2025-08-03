import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 [Simple Test] Testing basic signed URL...');
    
    // Test just the signed URL generation
    const { getSignedUploadUrl } = await import('@/services/firebase');
    
    const result = await getSignedUploadUrl(
      'video/mp4',
      'simple-test.mp4',
      100
    );
    
    console.log('✅ [Simple Test] Signed URL generated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Signed URL generation works',
      filePath: result.filePath,
      hasUploadUrl: !!result.uploadUrl,
      urlLength: result.uploadUrl.length
    });
    
  } catch (error) {
    console.error('❌ [Simple Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔍 [Simple Test POST] Testing fetch to signed URL...');
    
    // Test just the signed URL generation
    const { getSignedUploadUrl } = await import('@/services/firebase');
    
    const result = await getSignedUploadUrl(
      'video/mp4',
      'simple-test.mp4',
      20
    );
    
    console.log('✅ [Simple Test POST] Signed URL generated, testing fetch...');
    
    // Test a simple fetch to the signed URL
    const testData = 'Hello Firebase Storage';
    
    const response = await fetch(result.uploadUrl, {
      method: 'PUT',
      body: testData,
      headers: {
        'Content-Type': 'video/mp4',
      },
    });
    
    console.log(`🔍 [Simple Test POST] Fetch response: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `Fetch failed: ${response.status} ${response.statusText}`,
        errorText: errorText,
        step: 'fetch_to_signed_url'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Server-side upload to signed URL works',
      uploadStatus: response.status,
      filePath: result.filePath
    });
    
  } catch (error) {
    console.error('❌ [Simple Test POST] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}