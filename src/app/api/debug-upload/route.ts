import { NextResponse } from 'next/server';
import { getSignedUploadUrl } from '@/services/firebase';

export async function POST(request: Request) {
  try {
    console.log('🔍 [Debug Upload] Starting complete upload test...');
    
    // Test with a small file
    const testFileContent = 'This is a test file for debugging upload';
    const testBlob = new Blob([testFileContent], { type: 'text/plain' });
    
    // Step 1: Generate signed URL
    console.log('🔍 [Debug Upload] Step 1: Generating signed URL...');
    const { uploadUrl, filePath } = await getSignedUploadUrl(
      'text/plain',
      'test-upload.txt',
      testBlob.size
    );
    console.log(`✅ [Debug Upload] Signed URL generated: ${filePath}`);
    
    // Step 2: Try to upload to the signed URL
    console.log('🔍 [Debug Upload] Step 2: Uploading to signed URL...');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: testBlob,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    console.log(`🔍 [Debug Upload] Upload response status: ${uploadResponse.status}`);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ [Debug Upload] Upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText: errorText
      });
      
      return NextResponse.json({
        success: false,
        step: 'upload_to_bucket',
        error: `Upload to bucket failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        errorDetails: errorText,
        signedUrlWorked: true,
        uploadUrl: uploadUrl.substring(0, 100) + '...' // Only show first 100 chars for security
      }, { status: 500 });
    }
    
    console.log('✅ [Debug Upload] Upload to bucket successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Complete upload flow working correctly',
      filePath: filePath,
      uploadStatus: uploadResponse.status,
      signedUrlGenerated: true,
      uploadToBucketSuccessful: true
    });
    
  } catch (error) {
    console.error('❌ [Debug Upload] Error in upload test:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}