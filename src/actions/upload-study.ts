
'use server';

import { studyUploadFlow, StudyUploadFlowInput } from '@/ai/flows/study-upload-flow';
import { getSignedUploadUrl, getPublicUrl } from '@/services/firebase';
import { z } from 'zod';

type GenerateUploadUrlState = {
  success: boolean;
  uploadUrl?: string;
  filePath?: string;
  error?: string;
};

export async function generateUploadUrlAction(
  fileType: string,
  fileName: string,
  fileSize: number
): Promise<GenerateUploadUrlState> {
  console.log(`[generateUploadUrlAction] Called with: ${fileName}, ${fileType}, ${fileSize} bytes`);
  
  try {
    if (!fileType || !fileName || !fileSize) {
      throw new Error("Información de archivo incompleta.");
    }
    
    if (fileSize <= 0) {
      throw new Error("El tamaño del archivo debe ser mayor a 0.");
    }
    
    const result = await getSignedUploadUrl(fileType, fileName, fileSize);
    console.log(`[generateUploadUrlAction] Successfully generated URL for: ${result.filePath}`);
    return { success: true, ...result };
  } catch (error) {
    console.error('[generateUploadUrlAction] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al generar URL de subida.' 
    };
  }
}


const formSchema = z.object({
  patientName: z.string().min(1, 'El nombre del paciente es obligatorio.'),
  requestingDoctorName: z.string().min(1, 'El nombre del médico solicitante es obligatorio.'),
  description: z.string().optional(),
  filePath: z.string().min(1, 'La ruta del archivo es obligatoria.') // This will be passed after upload
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
  console.log('[uploadStudy] Starting upload process');
  
  try {
    const validatedFields = formSchema.safeParse({
      patientName: formData.get('patientName'),
      requestingDoctorName: formData.get('requestingDoctorName'),
      description: formData.get('description'),
      filePath: formData.get('filePath'),
    });

    if (!validatedFields.success) {
        console.error("[uploadStudy] Validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            status: 'error',
            message: 'Datos de formulario no válidos. Por favor, comprueba tus entradas.',
        };
    }
    
    const { patientName, requestingDoctorName, description, filePath } = validatedFields.data;
    console.log(`[uploadStudy] Processing study for patient: ${patientName}, file: ${filePath}`);

    // The file is already uploaded, so we get its public URL
    const videoUrl = await getPublicUrl(filePath);

    const input: StudyUploadFlowInput = {
        videoDataUri: videoUrl, // Passing URL instead of data URI now
        patientName,
        requestingDoctorName,
        description,
    };

    console.log('[uploadStudy] Calling AI flow...');
    const result = await studyUploadFlow(input);

    console.log('[uploadStudy] Successfully completed');
    return {
      status: 'success',
      message: result.confirmationMessage,
      data: result,
    };
  } catch (error) {
    console.error('[uploadStudy] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado en el servidor.';
    return {
      status: 'error',
      message: `Error al subir el estudio: ${errorMessage}`,
    };
  }
}
