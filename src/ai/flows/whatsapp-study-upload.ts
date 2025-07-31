'use server';

/**
 * @fileOverview This file implements the WhatsApp study upload flow.
 *
 * It allows doctors to upload heart studies (videos) via WhatsApp by sending the video, patient name, and requesting doctor to the system's WhatsApp number.
 * The system uses AI to identify the patient and doctor, uploads the study, and notifies the requesting doctor automatically.
 * - whatsappStudyUpload - A function that handles the WhatsApp study upload process.
 * - WhatsappStudyUploadInput - The input type for the whatsappStudyUpload function.
 * - WhatsappStudyUploadOutput - The return type for the whatsappStudyUpload function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { uploadVideoToStorage } from '@/services/firebase';

const WhatsappStudyUploadInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a heart study, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  patientName: z.string().describe('The full name of the patient.'),
  requestingDoctorName: z.string().describe('The full name of the requesting doctor.'),
});
export type WhatsappStudyUploadInput = z.infer<typeof WhatsappStudyUploadInputSchema>;

const WhatsappStudyUploadOutputSchema = z.object({
  patientId: z.string().describe('The ID of the patient in the system.'),
  requestingDoctorId: z.string().describe('The ID of the requesting doctor in the system.'),
  studyId: z.string().describe('The ID of the uploaded study in the system.'),
  confirmationMessage: z.string().describe('A message confirming the successful upload and notification.'),
  videoUrl: z.string().describe("The public URL of the uploaded video file.")
});
export type WhatsappStudyUploadOutput = z.infer<typeof WhatsappStudyUploadOutputSchema>;

export async function whatsappStudyUpload(input: WhatsappStudyUploadInput): Promise<WhatsappStudyUploadOutput> {
  return whatsappStudyUploadFlow(input);
}

const whatsappStudyUploadFlow = ai.defineFlow(
  {
    name: 'whatsappStudyUploadFlow',
    inputSchema: WhatsappStudyUploadInputSchema,
    outputSchema: WhatsappStudyUploadOutputSchema,
  },
  async input => {
    
    // Upload the video to Firebase Storage
    const videoUrl = await uploadVideoToStorage(input.videoDataUri);
    
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
