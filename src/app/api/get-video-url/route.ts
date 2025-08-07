import { NextResponse } from 'next/server';
import { getSignedDownloadUrl } from '@/services/firebase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'filePath is required' },
        { status: 400 }
      );
    }
    
    console.log('🎥 [GET-VIDEO-URL] Generating signed URL for:', filePath);
    
    // Generate signed URL for 1 hour
    const signedUrl = await getSignedDownloadUrl(filePath);
    
    console.log('✅ [GET-VIDEO-URL] Signed URL generated successfully');
    
    return NextResponse.json({
      success: true,
      signedUrl: signedUrl,
      expiresIn: '1 hour'
    });
    
  } catch (error) {
    console.error('❌ [GET-VIDEO-URL] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}