'use server';

import { z } from 'zod';
import { whatsappStudyUpload, WhatsappStudyUploadInput, WhatsappStudyUploadOutput } from '@/ai/flows/whatsapp-study-upload';

const formSchema = z.object({
  patientName: z.string().min(1, 'El nombre del paciente es obligatorio.'),
  requestingDoctorName: z.string().min(1, 'El nombre del médico solicitante es obligatorio.'),
  videoDataUri: z.string().min(1, 'Faltan los datos del video.'),
});

type State = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: WhatsappStudyUploadOutput;
};

export async function submitWhatsappStudy(
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const validatedFields = formSchema.safeParse({
      patientName: formData.get('patientName'),
      requestingDoctorName: formData.get('requestingDoctorName'),
      videoDataUri: formData.get('videoDataUri'),
    });

    if (!validatedFields.success) {
      return {
        status: 'error',
        message: 'Datos de formulario no válidos. Por favor, comprueba tus entradas.',
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
      data: result,
    };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
    return {
      status: 'error',
      message: `Error al subir el estudio: ${errorMessage}`,
    };
  }
}
