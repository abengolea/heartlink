import { NextResponse } from 'next/server';
import { generate } from '@/ai/genkit';

export async function POST(request: Request) {
  console.log('🤖 [IMPROVE-TRANSCRIPTION] Starting text improvement...');
  
  try {
    const body = await request.json();
    const { transcription, context = 'medical_study' } = body;
    
    if (!transcription) {
      return NextResponse.json({
        success: false,
        error: 'Transcription text is required'
      }, { status: 400 });
    }
    
    console.log('🤖 [IMPROVE-TRANSCRIPTION] Processing transcription of length:', transcription.length);
    
    // Create a prompt for improving medical transcriptions
    const prompt = `
Eres un asistente médico especializado en mejorar transcripciones de audio médicas.

Tu tarea es mejorar la siguiente transcripción de audio de un estudio médico:
- Corrige errores de ortografía y gramática
- Mejora la claridad y fluidez del texto
- Mantén toda la información médica original
- Usa terminología médica apropiada cuando sea necesario
- Organiza el texto en párrafos coherentes
- NO añadas información que no esté en el texto original
- NO elimines información médica importante

Transcripción original:
"${transcription}"

Proporciona solo el texto mejorado, sin explicaciones adicionales:`;

    const result = await generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      config: {
        temperature: 0.3, // Lower temperature for more consistent results
        maxOutputTokens: 2048
      }
    });
    
    const improvedText = result.text();
    
    console.log('✅ [IMPROVE-TRANSCRIPTION] Text improved successfully');
    console.log('🔍 [IMPROVE-TRANSCRIPTION] Original length:', transcription.length);
    console.log('🔍 [IMPROVE-TRANSCRIPTION] Improved length:', improvedText.length);
    
    return NextResponse.json({
      success: true,
      improvedText: improvedText,
      originalLength: transcription.length,
      improvedLength: improvedText.length
    });
    
  } catch (error) {
    console.error('❌ [IMPROVE-TRANSCRIPTION] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}