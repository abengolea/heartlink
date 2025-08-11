import { NextRequest, NextResponse } from 'next/server';
import { getStudyById } from '@/lib/firestore';
import { getPublicUrl } from '@/services/firebase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    
    console.log(`🎬 [VideoURL API] Getting video URL for study: ${studyId}`);
    
    // Obtener el estudio desde Firestore
    const study = await getStudyById(studyId);
    
    if (!study) {
      console.log(`❌ [VideoURL API] Study not found: ${studyId}`);
      return NextResponse.json(
        { error: 'Study not found' },
        { status: 404 }
      );
    }
    
    if (!study.videoPath) {
      console.log(`❌ [VideoURL API] No video path for study: ${studyId}`);
      return NextResponse.json(
        { error: 'No video found for this study' },
        { status: 404 }
      );
    }
    
    console.log(`🔍 [VideoURL API] Study video path: ${study.videoPath}`);
    
    // Obtener URL pública del video
    const videoUrl = await getPublicUrl(study.videoPath);
    
    if (!videoUrl) {
      console.log(`❌ [VideoURL API] Failed to get public URL for: ${study.videoPath}`);
      return NextResponse.json(
        { error: 'Failed to get video URL' },
        { status: 500 }
      );
    }
    
    console.log(`✅ [VideoURL API] Video URL obtained for study: ${studyId}`);
    
    return NextResponse.json({
      videoUrl,
      studyId,
      videoPath: study.videoPath
    });
    
  } catch (error) {
    console.error('❌ [VideoURL API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}