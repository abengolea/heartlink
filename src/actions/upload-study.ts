
'use server';

import { studyUploadFlow, StudyUploadFlowInput } from '@/ai/flows/study-upload-flow';
import { getSignedUploadUrl, getPublicUrl } from '@/services/firebase';
import { z } from 'zod';

const generateUploadUrlSchema = z.object({
  fileType: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
});

type GenerateUploadUrlState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  uploadUrl?: string;
  filePath?: string;
};

export async function generateUploadUrlAction(
  prevState: GenerateUploadUrlState,
  formData: FormData
): Promise<GenerateUploadUrlState> {
  try {
    const validatedFields = generateUploadUrlSchema.safeParse({
      fileType: formData.get('fileType'),
      fileName: formData.get('fileName'),
      fileSize: Number(formData.get('fileSize')),
    });

    if (!validatedFields.success) {
      return {
        status: 'error',
        message: 'Datos de archivo no válidos.',
      };
    }
    
    const { fileType, fileName, fileSize } = validatedFields.data;
    
    // Basic validation
    if (!fileType || !fileName || !fileSize) {
        return { status: 'error', message: "Faltan los detalles del archivo." };
    }

    const { uploadUrl, filePath } = await getSignedUploadUrl(fileType, fileName, fileSize);

    return {
      status: 'success',
      message: 'URL de subida generada.',
      uploadUrl,
      filePath,
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
    return { status: 'error', message: `Error al generar la URL de subida: ${errorMessage}` };
  }
}


const formSchema = z.object({
  patientName: z.string().min(1, 'El nombre del paciente es obligatorio.'),
  requestingDoctorName: z.string().min(1, 'El nombre del médico solicitante es obligatorio.'),
  description: z.string().optional(),
  filePath: z.string().min(1, 'La ruta del archivo es obligatoria.')
});

type State = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
};


export async function uploadStudy(
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const validatedFields = formSchema.safeParse({
      patientName: formData.get('patientName'),
      requestingDoctorName: formData.get('requestingDoctorName'),
      description: formData.get('description'),
      filePath: formData.get('filePath'),
    });

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'Datos de formulario no válidos. Por favor, comprueba tus entradas.',
        };
    }
    
    const { patientName, requestingDoctorName, description, filePath } = validatedFields.data;

    const videoUrl = getPublicUrl(filePath);

    const input: StudyUploadFlowInput = {
        videoDataUri: videoUrl, // Passing URL instead of data URI now
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
