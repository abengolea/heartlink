import { NextResponse } from 'next/server';
import { updateStudyTranscription } from '@/lib/firestore';

export async function POST(request: Request) {
  console.log('💾 [SAVE-TRANSCRIPTION] Starting transcription save...');
  
  try {
    const body = await request.json();
    const { studyId, transcription } = body;
    
    if (!studyId || !transcription) {
      return NextResponse.json({
        success: false,
        error: 'Study ID and transcription are required'
      }, { status: 400 });
    }
    
    console.log('💾 [SAVE-TRANSCRIPTION] Saving transcription for study:', studyId);
    console.log('💾 [SAVE-TRANSCRIPTION] Transcription length:', transcription.length);
    
    // Update the study with the transcription
    await updateStudyTranscription(studyId, transcription);
    
    console.log('✅ [SAVE-TRANSCRIPTION] Transcription saved successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Transcription saved successfully',
      studyId: studyId,
      transcriptionLength: transcription.length
    });
    
  } catch (error) {
    console.error('❌ [SAVE-TRANSCRIPTION] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}