
'use server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

// Check if Firebase has already been initialized
if (!getApps().length) {
    console.log("Initializing Firebase Admin with Application Default Credentials...");
    // In this environment, we rely on Application Default Credentials
    // which are automatically available.
    initializeApp();
}

const storage = getStorage();
const bucketName = 'heartlink-f4ftq.appspot.com';
const bucket = storage.bucket(bucketName);


export async function getSignedUploadUrl(fileType: string, fileName: string, fileSize: number) {
  if (fileSize > 10 * 1024 * 1024) { // 10MB limit
    throw new Error("El archivo es demasiado grande. El límite es 10MB.");
  }

  const extension = fileName.split('.').pop();
  const filePath = `studies/${uuidv4()}.${extension}`;
  const file = bucket.file(filePath);

  const options = {
    version: 'v4' as const,
    action: 'write' as const,
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: fileType,
  };

  const [uploadUrl] = await file.getSignedUrl(options);

  return { uploadUrl, filePath };
}

export async function getPublicUrl(filePath: string): Promise<string> {
  const file = bucket.file(filePath);
  return file.publicUrl();
}

/**
 * Uploads a video from a data URI to Firebase Storage.
 * @param dataUri The data URI of the video.
 * @returns The public URL of the uploaded video.
 */
export async function uploadVideoToStorage(dataUri: string): Promise<string> {
  try {
    // This function might be deprecated in favor of signed URLs,
    // but keeping it for other potential uses.
    const match = dataUri.match(/^data:(.*);base64,(.*)$/);
    if (!match) {
        // If it's not a data URI, assume it's already a URL and return it.
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

  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 403) {
        console.error("Firebase Storage permission error: Ensure the service account has 'Storage Admin' role.");
        throw new Error("No tienes permisos para subir archivos. Por favor, verifica los permisos de la cuenta de servicio en la consola de Firebase.");
    }
    throw new Error('Failed to upload video to storage.');
  }
}
