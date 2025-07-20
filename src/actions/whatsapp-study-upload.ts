'use server';

import { z } from 'zod';
import { whatsappStudyUpload, WhatsappStudyUploadInput } from '@/ai/flows/whatsapp-study-upload';

const formSchema = z.object({
  video: z.any(), // File handled separately
  patientName: z.string().min(1, 'Patient name is required.'),
  requestingDoctorName: z.string().min(1, 'Requesting doctor name is required.'),
  videoDataUri: z.string().min(1, 'Video data is missing.'),
});

type State = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: {
    studyId: string;
  };
};

export async function submitWhatsappStudy(
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const validatedFields = formSchema.safeParse({
      video: formData.get('video'),
      patientName: formData.get('patientName'),
      requestingDoctorName: formData.get('requestingDoctorName'),
      videoDataUri: formData.get('videoDataUri'),
    });

    if (!validatedFields.success) {
      return {
        status: 'error',
        message: 'Invalid form data. Please check your inputs.',
      };
    }
    
    const input: WhatsappStudyUploadInput = {
        videoDataUri: validatedFields.data.videoDataUri,
        patientName: validatedFields.data.patientName,
        requestingDoctorName: validatedFields.data.requestingDoctorName,
    };

    const result = await whatsappStudyUpload(input);

    return {
      status: 'success',
      message: result.confirmationMessage,
      data: { studyId: result.studyId },
    };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return {
      status: 'error',
      message: `Failed to upload study: ${errorMessage}`,
    };
  }
}
