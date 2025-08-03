import { v4 as uuidv4 } from 'uuid';
import { getStorageBucket } from '@/lib/firebase-admin-v2';

export async function getSignedUploadUrl(
  fileType: string, 
  fileName: string, 
  fileSize: number
): Promise<{ uploadUrl: string; filePath: string }> {
  console.log(`🔍 [Upload] Generating signed URL for: ${fileName} (${fileType}, ${fileSize} bytes)`);
  
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
    console.log('🔍 [Upload] Getting storage bucket...');
    const bucket = getStorageBucket();
    
    const extension = fileName.split('.').pop()?.toLowerCase() || 'mp4';
    const filePath = `studies/${uuidv4()}.${extension}`;
    
    console.log(`🔍 [Upload] Creating file reference: ${filePath}`);
    const file = bucket.file(filePath);

    // Generate signed URL
    console.log('🔍 [Upload] Generating signed URL...');
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    });

    console.log(`✅ [Upload] Successfully generated signed URL for: ${filePath}`);
    return { uploadUrl, filePath };
  } catch (error) {
    console.error('❌ [Upload] Error generating signed URL:', error);
    
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.message.includes('credentials') || error.message.includes('authentication')) {
        throw new Error('Error de credenciales de Firebase. Verifica tu configuración.');
      }
      if (error.message.includes('bucket') || error.message.includes('storage')) {
        throw new Error('Error de configuración del bucket. Verifica que el bucket existe.');
      }
      if (error.message.includes('permission') || error.message.includes('access')) {
        throw new Error('Error de permisos. Verifica los permisos de la cuenta de servicio.');
      }
      
      // Log the actual error for debugging
      console.error('📊 [Upload] Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      throw new Error(`Error de Firebase: ${error.message}`);
    }
    
    throw new Error('No se pudo generar la URL de subida. Por favor, intente nuevamente.');
  }
}

export async function getPublicUrl(filePath: string): Promise<string> {
  console.log(`🔍 [Public URL] Getting public URL for: ${filePath}`);
  
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
    
    console.log(`✅ [Public URL] Generated: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ [Public URL] Error getting public URL:', error);
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
    console.log('🔍 [Direct Upload] Starting video upload to storage...');
    
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
    
    console.log(`🔍 [Direct Upload] Creating file: ${filename}`);
    const file = bucket.file(filename);
    
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
    });
    
    await file.makePublic();
    
    const publicUrl = file.publicUrl();
    console.log(`✅ [Direct Upload] File uploaded successfully: ${publicUrl}`);
    return publicUrl;

  } catch (error: any) {
    console.error('❌ [Direct Upload] Error uploading to Firebase Storage:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 403) {
        console.error("Firebase Storage permission error: Ensure the service account has 'Storage Admin' role.");
        throw new Error("No tienes permisos para subir archivos. Por favor, verifica los permisos de la cuenta de servicio en la consola de Firebase.");
    }
    throw new Error('Failed to upload video to storage.');
  }
}
