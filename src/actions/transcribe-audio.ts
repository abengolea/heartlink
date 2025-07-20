
'use server';

import { transcribeAudio } from "@/ai/flows/transcribe-audio-flow";

type State = {
    status: 'success' | 'error' | 'idle';
    message: string;
    transcription?: string;
}

export async function transcribeAudioAction(audioDataUri: string): Promise<State> {
    if (!audioDataUri) {
        return {
            status: 'error',
            message: 'No se proporcionó ningún dato de audio.',
        };
    }

    try {
        const result = await transcribeAudio({ audioDataUri });
        return {
            status: 'success',
            message: 'Transcripción exitosa.',
            transcription: result.transcription,
        };
    } catch (error) {
        console.error('Error in transcribeAudioAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
        return {
            status: 'error',
            message: `Error al transcribir el audio: ${errorMessage}`,
        };
    }
}
