
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
import { saveDynamicStudy } from '@/lib/dynamic-data';
import type { Study } from '@/lib/types';

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

    // Generate unique IDs for now (in the future, create in Firestore)
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    const patientId = `pat_${timestamp}_${randomSuffix}`;
    const requestingDoctorId = `doc_${timestamp}_${randomSuffix}`;
    const studyId = `study_${timestamp}_${randomSuffix}`;
    
    const confirmationMessage = `✅ Estudio guardado exitosamente!\n\n📋 Paciente: ${input.patientName}\n👨‍⚕️ Médico solicitante: ${input.requestingDoctorName}\n🎥 Video: ${videoUrl}\n📝 ID del estudio: ${studyId}`;

    console.log(`[StudyUploadFlow] Generated study with ID: ${studyId}`);

    // Create the study object and save it dynamically
    const newStudy: Study = {
      id: studyId,
      patientId: patientId,
      videoUrl: videoUrl,
      reportUrl: '',
      date: new Date().toISOString(),
      isUrgent: false,
      description: input.description || 'Estudio cardiológico subido automáticamente',
      diagnosis: 'Pendiente de análisis',
      comments: []
    };

    // Save the study (client-side in localStorage for now)
    if (typeof window !== 'undefined') {
      saveDynamicStudy(newStudy);
    }

    return {
      patientId,
      requestingDoctorId,
      studyId,
      confirmationMessage,
      videoUrl
    };
  }
);
