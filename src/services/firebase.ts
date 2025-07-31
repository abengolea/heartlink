
'use server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
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
// The bucket name should be dynamically retrieved or configured, 
// but for now we'll use the one provided by the user.
const bucketName = 'notificas-f9953.appspot.com'; 
const bucket = storage.bucket(bucketName);

/**
 * Uploads a video from a data URI to Firebase Storage.
 * @param dataUri The data URI of the video.
 * @returns The public URL of the uploaded video.
 */
export async function uploadVideoToStorage(dataUri: string): Promise<string> {
  try {
    // Extract mime type and base64 data from data URI
    const match = dataUri.match(/^data:(.*);base64,(.*)$/);
    if (!match) {
      throw new Error('Invalid data URI format.');
    }
    
    const mimeType = match[1];
    const base64Data = match[2];
    
    // Create a buffer from the base64 data
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique filename
    const filename = `studies/${uuidv4()}.${mimeType.split('/')[1] || 'mp4'}`;
    
    // Get a reference to the file in Firebase Storage
    const file = bucket.file(filename);
    
    // Upload the file
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
    });
    
    // Make the file public (or get a signed URL if you want it to be private)
    await file.makePublic();
    
    // Return the public URL
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
