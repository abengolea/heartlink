'use server';

/**
 * @fileOverview This file implements the study upload flow.
 *
 * It allows doctors to upload heart studies (videos), uploads the study, and notifies the requesting doctor automatically.
 * - processStudyUpload - Lógica pura sin Genkit (no requiere GEMINI_API_KEY).
 * - studyUploadFlow - Wrapper Genkit (opcional, para dev UI).
 */

import { createStudy, findOrCreatePatient, getAllUsers } from '@/lib/firestore';

export type StudyUploadFlowInput = {
  videoDataUri: string;
  patientName: string;
  requestingDoctorName: string;
  description?: string;
};

export type StudyUploadFlowOutput = {
  patientId: string;
  requestingDoctorId: string;
  studyId: string;
  confirmationMessage: string;
  videoUrl: string;
};

/**
 * Procesa la subida del estudio sin depender de Genkit/Gemini.
 * Usado por la API de upload para evitar requerir GEMINI_API_KEY.
 */
export async function processStudyUpload(input: StudyUploadFlowInput): Promise<StudyUploadFlowOutput> {
  const videoUrl = input.videoDataUri;
  const allUsers = await getAllUsers();

  const existingDoctor = allUsers.find(u =>
    u.name.toLowerCase().includes(input.requestingDoctorName.toLowerCase()) ||
    input.requestingDoctorName.toLowerCase().includes(u.name.toLowerCase())
  );

  const requestingDoctorId = existingDoctor?.id || allUsers[0]?.id || 'default-doctor';

  const patient = await findOrCreatePatient(
    input.patientName,
    requestingDoctorId  // Médico solicitante, no el operador
  );

  const studyId = await createStudy({
    patientId: patient.id,  // ID string, no el objeto
    requestingDoctorId,
    videoUrl,
    reportUrl: '',
    date: new Date().toISOString(),
    isUrgent: false,
    description: input.description || 'Estudio cardiológico subido automáticamente',
    diagnosis: 'Pendiente de análisis',
    comments: []
  });

  const confirmationMessage = `✅ Estudio guardado correctamente.\n\n📋 Paciente: ${input.patientName}\n👨‍⚕️ Médico solicitante: ${input.requestingDoctorName}\n📝 ID: ${studyId}`;

  console.log(`[StudyUploadFlow] Study created - ID: ${studyId}, Patient: ${patient.id}`);

  return {
    patientId: patient.id,
    requestingDoctorId,
    studyId,
    confirmationMessage,
    videoUrl
  };
}

/** @deprecated Usar processStudyUpload. Mantenido por compatibilidad con Genkit dev. */
export async function studyUploadFlow(input: StudyUploadFlowInput): Promise<StudyUploadFlowOutput> {
  return processStudyUpload(input);
}
