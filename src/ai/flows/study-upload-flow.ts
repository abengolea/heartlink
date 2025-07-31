
'use server';

/**
 * @fileOverview This file implements the study upload flow.
 *
 * It allows doctors to upload heart studies (videos), uploads the study, and notifies the requesting doctor automatically.
 * - studyUploadFlow - A function that handles the study upload process.
 * - StudyUploadFlowInput - The input type for the studyUploadFlow function.
 * - StudyUploadFlowOutput - The return type for the studyUploadFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
// The uploadVideoToStorage function is no longer needed here as the upload is handled client-side
// import { uploadVideoToStorage } from '@/services/firebase';

const StudyUploadFlowInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a heart study, as a public URL to the file in storage."
    ),
  patientName: z.string().describe('The full name of the patient.'),
  requestingDoctorName: z.string().describe('The full name of the requesting doctor.'),
  description: z.string().optional().describe('The description or report draft for the study.'),
});
export type StudyUploadFlowInput = z.infer<typeof StudyUploadFlowInputSchema>;

const StudyUploadFlowOutputSchema = z.object({
  patientId: z.string().describe('The ID of the patient in the system.'),
  requestingDoctorId: z.string().describe('The ID of the requesting doctor in the system.'),
  studyId: z.string().describe('The ID of the uploaded study in the system.'),
  confirmationMessage: z.string().describe('A message confirming the successful upload and notification.'),
  videoUrl: z.string().describe("The public URL of the uploaded video file.")
});
export type StudyUploadFlowOutput = z.infer<typeof StudyUploadFlowOutputSchema>;

export async function studyUploadFlow(input: StudyUploadFlowInput): Promise<StudyUploadFlowOutput> {
  return studyUploadFlowFn(input);
}

const studyUploadFlowFn = ai.defineFlow(
  {
    name: 'studyUploadFlow',
    inputSchema: StudyUploadFlowInputSchema,
    outputSchema: StudyUploadFlowOutputSchema,
  },
  async input => {
    
    // The video is already uploaded, the input.videoDataUri is the public URL
    const videoUrl = input.videoDataUri;
    
    // TODO: Implement the logic to identify the patient and doctor using AI.
    // TODO: Implement the logic to create the study in Firestore.
    // TODO: Implement the logic to send a confirmation message to the requesting doctor.

    // Placeholder implementation
    const patientId = 'patient123'; // Replace with actual patient ID
    const requestingDoctorId = 'doctor456'; // Replace with actual doctor ID
    const studyId = 'study789'; // Replace with actual study ID
    const confirmationMessage = `El estudio para ${input.patientName} ha sido subido y el médico solicitante, ${input.requestingDoctorName}, ha sido notificado. El video está disponible en: ${videoUrl}`;

    return {
      patientId,
      requestingDoctorId,
      studyId,
      confirmationMessage,
      videoUrl
    };
  }
);
