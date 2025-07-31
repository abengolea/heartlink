
'use server';

import { z } from 'zod';
import { studyUploadFlow, StudyUploadFlowInput } from '@/ai/flows/study-upload-flow';

const formSchema = z.object({
  video: z.instanceof(File).refine(file => file.size > 0, 'Se requiere un archivo de video.'),
  patientName: z.string().min(1, 'El nombre del paciente es obligatorio.'),
  requestingDoctorName: z.string().min(1, 'El nombre del médico solicitante es obligatorio.'),
  description: z.string().optional(),
});

type State = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
};

export async function uploadStudy(
  formData: FormData
): Promise<State> {
  try {
    const videoFile = formData.get('video');
    const validatedFields = formSchema.safeParse({
      video: videoFile,
      patientName: formData.get('patientName'),
      requestingDoctorName: formData.get('requestingDoctorName'),
      description: formData.get('description'),
    });

    if (!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            status: 'error',
            message: 'Datos de formulario no válidos. Por favor, comprueba tus entradas.',
        };
    }
    
    const { video, patientName, requestingDoctorName, description } = validatedFields.data;

    // Convert File to a Buffer and then to a data URI
    const buffer = Buffer.from(await video.arrayBuffer());
    const videoDataUri = `data:${video.type};base64,${buffer.toString('base64')}`;

    const input: StudyUploadFlowInput = {
        videoDataUri,
        patientName,
        requestingDoctorName,
        description,
    };

    const result = await studyUploadFlow(input);

    return {
      status: 'success',
      message: result.confirmationMessage,
      data: result,
    };
  } catch (error) {
    console.error('Error in uploadStudy action:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado en el servidor.';
    return {
      status: 'error',
      message: `Error al subir el estudio: ${errorMessage}`,
    };
  }
}
