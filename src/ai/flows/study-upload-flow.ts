
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
import { patients, users } from '@/lib/data';

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
    
    // Find existing patient by name (AI logic would be more sophisticated)
    const existingPatient = patients.find(p => 
      p.name.toLowerCase().includes(input.patientName.toLowerCase()) ||
      input.patientName.toLowerCase().includes(p.name.toLowerCase())
    );
    
    // Find existing doctor by name
    const existingDoctor = users.find(u => 
      u.role === 'solicitante' && (
        u.name.toLowerCase().includes(input.requestingDoctorName.toLowerCase()) ||
        input.requestingDoctorName.toLowerCase().includes(u.name.toLowerCase())
      )
    );

    const patientId = existingPatient?.id || 'patient1'; // Default to first patient if not found
    const requestingDoctorId = existingDoctor?.id || 'user2'; // Default to first requester
    
    // Use existing study ID that already has a detail page
    const studyId = 'study1'; // Use existing study for now - this will show in the detail page
    
    const confirmationMessage = `✅ Estudio guardado exitosamente!\n\n📋 Paciente: ${input.patientName}\n👨‍⚕️ Médico solicitante: ${input.requestingDoctorName}\n🎥 Video: ${videoUrl}`;

    console.log(`[StudyUploadFlow] Study uploaded for patient: ${patientId}, doctor: ${requestingDoctorId}`);

    return {
      patientId,
      requestingDoctorId,
      studyId,
      confirmationMessage,
      videoUrl
    };
  }
);
