import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

function initializeFirebaseAdmin(): App {
    if (getApps().length) {
        return getApps()[0];
    }
    
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY not set. Please set this environment variable with your service account key JSON.");
        throw new Error("La configuración del servidor de Firebase está incompleta. La clave de la cuenta de servicio no se ha encontrado.");
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        console.log("Initializing Firebase Admin with service account...");
        return initializeApp({
            credential: cert(serviceAccount),
            storageBucket: 'heartlink-f4ftq.appspot.com' 
        });
    } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY or initializing Firebase Admin:", e);
        throw new Error("La clave de la cuenta de servicio de Firebase no es un JSON válido.");
    }
}

const firebaseApp = initializeFirebaseAdmin();
const storage = getStorage(firebaseApp);
const bucket = storage.bucket();


export async function getSignedUploadUrl(fileType: string, fileName: string, fileSize: number) {
  if (fileSize > 50 * 1024 * 1024) { // 50MB limit
    throw new Error("El archivo es demasiado grande. El límite es 50MB.");
  }

  const extension = fileName.split('.').pop() || 'mp4';
  const filePath = `studies/${uuidv4()}.${extension}`;
  const file = bucket.file(filePath);

  const options = {
    version: 'v4' as const,
    action: 'write' as const,
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: fileType,
  };

  try {
    const [uploadUrl] = await file.getSignedUrl(options);
    return { uploadUrl, filePath };
  } catch(error) {
    console.error("Error getting signed URL from Firebase:", error);
    if (error instanceof Error && 'code' in error && (error as any).code === 403) {
      console.error("Firebase Storage permission error: Ensure the service account has 'Storage Object Admin' or 'Storage Admin' role.");
      throw new Error("No tienes permisos para generar URLs de subida. Por favor, verifica los permisos de la cuenta de servicio en la consola de Firebase.");
    }
    throw new Error("No se pudo generar la URL para la subida de archivos. Verifica la configuración de Firebase.");
  }
}

export async function getPublicUrl(filePath: string): Promise<string> {
  const file = bucket.file(filePath);
  await file.makePublic();
  return file.publicUrl();
}

/**
 * Uploads a video from a data URI to Firebase Storage.
 * @param dataUri The data URI of the video.
 * @returns The public URL of the uploaded video.
 */
export async function uploadVideoToStorage(dataUri: string): Promise<string> {
  try {
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

  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 403) {
        console.error("Firebase Storage permission error: Ensure the service account has 'Storage Admin' role.");
        throw new Error("No tienes permisos para subir archivos. Por favor, verifica los permisos de la cuenta de servicio en la consola de Firebase.");
    }
    throw new Error('Failed to upload video to storage.');
  }
}
