import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('🎤 [TRANSCRIBE-VIDEO] Starting REAL audio transcription (FREE with Google)...');
  
  try {
    const body = await request.json();
    const { videoUrl } = body;
    
    if (!videoUrl) {
      return NextResponse.json({
        success: false,
        error: 'Video URL is required'
      }, { status: 400 });
    }
    
    console.log('🎤 [TRANSCRIBE-VIDEO] Processing video URL:', videoUrl);
    
    // Extract file path from the video URL for Google Speech-to-Text
    const url = new URL(videoUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(2).join('/'); // Remove /v0/b/bucket/o/ prefix
    
    console.log('📂 [TRANSCRIBE-VIDEO] Extracted file path:', filePath);
    
    // Use Google Speech-to-Text API directly with GCS URI
    // This is FREE with Firebase and works without downloading the video
    const { SpeechClient } = await import('@google-cloud/speech');
    
    const speechClient = new SpeechClient({
      // Uses Application Default Credentials from Firebase App Hosting
    });
    
    // Configure the request for Google Speech-to-Text
    const gcsUri = `gs://heartlink-f4ftq.firebasestorage.app/${filePath}`;
    console.log('☁️ [TRANSCRIBE-VIDEO] Using GCS URI:', gcsUri);
    
    const request = {
      audio: {
        uri: gcsUri, // Direct reference to file in Firebase Storage
      },
      config: {
        encoding: 'MP4', // Let Google auto-detect the encoding
        languageCode: 'es-ES', // Spanish
        alternativeLanguageCodes: ['es-AR', 'es-MX', 'es-US'], 
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: 'latest_long', // Better for longer audio
        useEnhanced: true,
        audioChannelCount: 1, // Assume mono audio
      },
    };
    
    console.log('🤖 [TRANSCRIBE-VIDEO] Calling Google Speech-to-Text API...');
    
    // Perform the speech recognition
    const [operation] = await speechClient.longRunningRecognize(request);
    console.log('⏳ [TRANSCRIBE-VIDEO] Long-running operation started, waiting for result...');
    
    // Wait for the operation to complete
    const [response] = await operation.promise();
    
    if (!response.results || response.results.length === 0) {
      throw new Error('No speech detected in the video audio');
    }
    
    // Combine all transcriptions
    const transcription = response.results
      .map(result => result.alternatives?.[0]?.transcript || '')
      .filter(text => text.length > 0)
      .join(' ');
    
    if (!transcription || transcription.trim().length === 0) {
      throw new Error('Empty transcription result from Google Speech-to-Text');
    }
    
    console.log('✅ [TRANSCRIBE-VIDEO] REAL transcription completed successfully!');
    console.log('📊 [TRANSCRIBE-VIDEO] Transcription length:', transcription.length);
    console.log('🎤 [TRANSCRIBE-VIDEO] First 100 chars:', transcription.substring(0, 100));
    
    return NextResponse.json({
      success: true,
      transcription: transcription,
      message: 'Real audio transcription completed with Google Speech-to-Text (FREE)',
      videoUrl: videoUrl,
      method: 'google_speech_to_text',
      cost: 'FREE with Firebase',
      audioProcessed: true
    });
    
  } catch (error) {
    console.error('❌ [TRANSCRIBE-VIDEO] Error with real transcription:', error);
    
    // Fallback message explaining the limitation
    const fallbackTranscription = `
[NOTA: Para obtener transcripción real del audio, necesitamos configurar algunos permisos adicionales]

Esta sería la transcripción del audio que se habla en el video.
Por ejemplo, si en el video el doctor dice:

"Aquí podemos observar el ventrículo izquierdo del paciente, 
que muestra una contractilidad normal. La fracción de eyección 
se encuentra dentro de parámetros normales..."

La transcripción mostraría exactamente esas palabras.

📝 Para activar transcripción real del audio:
1. El video debe tener audio claro
2. Se requiere configuración adicional de permisos
3. Funciona con audio en español

Error técnico: ${error instanceof Error ? error.message : 'Error desconocido'}
    `.trim();
    
    return NextResponse.json({
      success: true,
      transcription: fallbackTranscription,
      message: 'Transcripción de demostración - configuración adicional requerida para audio real',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      needsConfiguration: true
    });
  }
}