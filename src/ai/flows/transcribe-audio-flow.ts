
'use server';

/**
 * @fileOverview This file implements the audio transcription flow.
 * It takes an audio or video data URI and returns the transcribed text using a multimodal AI model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio or video recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio/video.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;


export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}


const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: [
        { text: 'Transcribe el siguiente audio a texto. El audio contiene un dictado médico para un informe de un estudio cardiológico. Transcribe únicamente el texto hablado. Si el archivo es un video, transcribe el audio del video.' },
        { media: { url: input.audioDataUri } },
      ],
      model: 'googleai/gemini-2.0-flash',
    });

    const transcription = llmResponse.text;

    if (!transcription) {
        throw new Error("La transcripción ha fallado. El modelo no devolvió texto.");
    }
    
    return { transcription };
  }
);
