import { v4 as uuidv4 } from 'uuid';
import { getStorageBucket } from '@/lib/firebase-admin';

export async function getSignedUploadUrl(
  fileType: string, 
  fileName: string, 
  fileSize: number
): Promise<{ uploadUrl: string; filePath: string }> {
  console.log(`Generating signed URL for file: ${fileName}, type: ${fileType}, size: ${fileSize}`);
  
  // File size validation
  if (fileSize > 50 * 1024 * 1024) {
    throw new Error("El archivo es demasiado grande. El límite es 50MB.");
  }

  // File type validation
  const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'];
  if (!allowedTypes.includes(fileType)) {
    throw new Error("Tipo de archivo no permitido. Solo se permiten videos MP4, AVI, MOV.");
  }

  try {
    const bucket = getStorageBucket();
    const extension = fileName.split('.').pop()?.toLowerCase() || 'mp4';
    const filePath = `studies/${uuidv4()}.${extension}`;
    
    console.log(`Creating file reference: ${filePath}`);
    const file = bucket.file(filePath);

    // Generate signed URL
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    });

    console.log(`Successfully generated signed URL for: ${filePath}`);
    return { uploadUrl, filePath };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        throw new Error('Error de credenciales de Firebase. Verifica tu configuración.');
      }
      if (error.message.includes('bucket')) {
        throw new Error('Error de configuración del bucket. Verifica que el bucket existe.');
      }
    }
    throw new Error('No se pudo generar la URL de subida. Por favor, intente nuevamente.');
  }
}

export async function getPublicUrl(filePath: string): Promise<string> {
  console.log(`Getting public URL for file: ${filePath}`);
  
  try {
    const bucket = getStorageBucket();
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    await file.makePublic();
    const publicUrl = file.publicUrl();
    
    console.log(`Public URL generated: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    throw new Error('No se pudo obtener la URL pública del archivo.');
  }
}

/**
 * Uploads a video from a data URI to Firebase Storage.
 * @param dataUri The data URI of the video.
 * @returns The public URL of the uploaded video.
 */
export async function uploadVideoToStorage(dataUri: string): Promise<string> {
  try {
    const bucket = getStorageBucket();
    const match = dataUri.match(/^data:(.*);base64,(.*)$/);
    if (!match) {
        if (dataUri.startsWith('http')) {
            return dataUri;
        }
      throw new Error('Invalid data URI or URL format.');
    }
    
    const mimeType = match[1];
    const base64Data = match[2];
    
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filename = `studies/${uuidv4()}.${mimeType.split('/')[1] || 'mp4'}`;
    
    const file = bucket.file(filename);
    
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
    });
    
    await file.makePublic();
    
    const publicUrl = file.publicUrl();
    console.log(`File uploaded successfully: ${publicUrl}`);
    return publicUrl;

  } catch (error: any) {
    console.error('Error uploading to Firebase Storage:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 403) {
        console.error("Firebase Storage permission error: Ensure the service account has 'Storage Admin' role.");
        throw new Error("No tienes permisos para subir archivos. Por favor, verifica los permisos de la cuenta de servicio en la consola de Firebase.");
    }
    throw new Error('Failed to upload video to storage.');
  }
}
