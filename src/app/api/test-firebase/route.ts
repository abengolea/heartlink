import { NextResponse } from 'next/server';
import { getStorageBucket } from '@/lib/firebase-admin-v4';

export async function GET() {
  try {
    console.log('🔍 [Test Firebase] Starting test...');
    
    // Test 1: Initialize Firebase Admin
    console.log('🔍 [Test Firebase] Testing Firebase Admin initialization...');
    const bucket = getStorageBucket();
    console.log('✅ [Test Firebase] Firebase Admin initialized successfully');
    
    // Test 2: Try to generate a signed URL
    console.log('🔍 [Test Firebase] Testing signed URL generation...');
    const file = bucket.file('test/test-file.txt');
    
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: 'text/plain',
    });
    
    console.log('✅ [Test Firebase] Signed URL generated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin and Signed URLs working correctly',
      signedUrlGenerated: true,
      signedUrlLength: signedUrl.length,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      }
    });
    
  } catch (error) {
    console.error('❌ [Test Firebase] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        availableKeys: Object.keys(process.env).filter(k => 
          k.includes('FIREBASE') || k.includes('GOOGLE') || k.includes('GCLOUD')
        )
      }
    }, { status: 500 });
  }
}