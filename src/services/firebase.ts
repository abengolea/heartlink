import { v4 as uuidv4 } from 'uuid';
import { getStorageBucket } from '@/lib/firebase-admin-v4';

export async function getSignedUploadUrl(
  fileType: string, 
  fileName: string, 
  fileSize: number
): Promise<{ uploadUrl: string; filePath: string }> {
  console.log(`🔍 [Upload v4] Generating signed URL with ADC for: ${fileName} (${fileType}, ${fileSize} bytes)`);
  
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
    console.log('🔍 [Upload v4] Getting storage bucket with ADC credentials...');
    const bucket = getStorageBucket();
    
    const extension = fileName.split('.').pop()?.toLowerCase() || 'mp4';
    const filePath = `studies/${uuidv4()}.${extension}`;
    
    console.log(`🔍 [Upload v4] Creating file reference: ${filePath}`);
    const file = bucket.file(filePath);

    // Generate signed URL - should work with ADC
    console.log('🔍 [Upload v4] Generating signed URL with Application Default Credentials...');
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    });

    console.log(`✅ [Upload v4] Successfully generated signed URL with ADC: ${filePath}`);
    return { uploadUrl, filePath };
  } catch (error) {
    console.error('❌ [Upload v4] Error generating signed URL with ADC:', error);
    
    // Enhanced error handling for App Hosting with ADC
    if (error instanceof Error) {
      if (error.message.includes('credentials') || error.message.includes('authentication')) {
        throw new Error('Error de credenciales ADC en App Hosting. Verifica permisos IAM.');
      }
      if (error.message.includes('token') || error.message.includes('access')) {
        throw new Error('Error de token ADC. El service account necesita roles adicionales.');
      }
      if (error.message.includes('bucket') || error.message.includes('storage')) {
        throw new Error('Error de bucket con ADC. Verifica configuración de Storage.');
      }
      if (error.message.includes('permission') || error.message.includes('forbidden')) {
        throw new Error('Error de permisos ADC. Service account necesita Storage Object Admin + Token Creator.');
      }
      
      // Log the actual error for debugging
      console.error('📊 [Upload v4] Full ADC error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        environment: process.env.NODE_ENV
      });
      
      throw new Error(`Error de Firebase ADC en App Hosting: ${error.message}`);
    }
    
    throw new Error('No se pudo generar la URL de subida con ADC. Verifica permisos IAM.');
  }
}

export async function getPublicUrl(filePath: string): Promise<string> {
  console.log(`🔍 [Public URL v4] Getting public URL with ADC for: ${filePath}`);
  
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
    
    console.log(`✅ [Public URL v4] Generated with ADC: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ [Public URL v4] Error getting public URL with ADC:', error);
    throw new Error('No se pudo obtener la URL pública del archivo con ADC.');
  }
}

/**
 * Uploads a video from a data URI to Firebase Storage.
 * @param dataUri The data URI of the video.
 * @returns The public URL of the uploaded video.
 */
export async function uploadVideoToStorage(dataUri: string): Promise<string> {
  try {
    console.log('🔍 [Direct Upload v4] Starting video upload with ADC...');
    
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
    
    console.log(`🔍 [Direct Upload v4] Creating file with ADC: ${filename}`);
    const file = bucket.file(filename);
    
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
    });
    
    await file.makePublic();
    
    const publicUrl = file.publicUrl();
    console.log(`✅ [Direct Upload v4] File uploaded successfully with ADC: ${publicUrl}`);
    return publicUrl;

  } catch (error: any) {
    console.error('❌ [Direct Upload v4] Error uploading with ADC:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 403) {
        console.error("Firebase Storage permission error with ADC: Service account needs Storage Admin + Token Creator roles.");
        throw new Error("No tienes permisos para subir archivos con ADC. Verifica roles IAM del service account.");
    }
    throw new Error('Failed to upload video to storage with ADC.');
  }
}
