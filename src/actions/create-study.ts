
'use server';

import { z } from 'zod';
import { whatsappStudyUpload, WhatsappStudyUploadInput, WhatsappStudyUploadOutput } from '@/ai/flows/whatsapp-study-upload';

const formSchema = z.object({
  patientName: z.string().min(1, 'El nombre del paciente es obligatorio.'),
  requestingDoctorName: z.string().min(1, 'El nombre del médico solicitante es obligatorio.'),
  videoDataUri: z.string().min(1, 'Faltan los datos del video.'),
  description: z.string().optional(),
});

type State = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: WhatsappStudyUploadOutput;
};

export async function createStudy(
  formData: FormData
): Promise<State> {
  try {
    const validatedFields = formSchema.safeParse({
      patientName: formData.get('patientName'),
      requestingDoctorName: formData.get('requestingDoctorName'),
      videoDataUri: formData.get('videoDataUri'),
      description: formData.get('description'),
    });

    if (!validatedFields.success) {
      return {
        status: 'error',
        message: 'Datos de formulario no válidos. Por favor, comprueba tus entradas.',
      };
    }
    
    // For now, we can reuse the whatsappStudyUpload flow as the logic is similar.
    // In the future, this could point to a different flow if needed.
    const input: WhatsappStudyUploadInput = {
        videoDataUri: validatedFields.data.videoDataUri,
        patientName: validatedFields.data.patientName,
        requestingDoctorName: validatedFields.data.requestingDoctorName,
        // The description from the form can be passed to the flow if the flow is updated to handle it.
        // For now, we are not passing it.
    };

    const result = await whatsappStudyUpload(input);

    return {
      status: 'success',
      message: result.confirmationMessage,
      data: result,
    };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
    return {
      status: 'error',
      message: `Error al crear el estudio: ${errorMessage}`,
    };
  }
}
