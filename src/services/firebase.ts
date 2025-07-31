'use server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

// Check if the service account key is provided
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  if (process.env.NODE_ENV === 'production') {
    // In production, we can rely on Application Default Credentials
    console.log("Initializing Firebase Admin with Application Default Credentials...");
    initializeApp();
  } else {
    // In development, we need the service account key
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please provide your Firebase service account key as a JSON string in your .env.local file.');
  }
} else {
    // Initialize Firebase Admin SDK
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
}


const storage = getStorage();
const bucketName = 'notificas-f9953.firebasestorage.app'; 
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
    throw new Error('Failed to upload video to storage.');
  }
}

