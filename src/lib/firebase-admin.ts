import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const firebaseAdminConfig = (): ServiceAccount => {
  const serviceAccountKey = process.env.SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('Missing SERVICE_ACCOUNT_KEY environment variable');
  }
  
  try {
    return JSON.parse(serviceAccountKey) as ServiceAccount;
  } catch (error) {
    console.error('Error parsing SERVICE_ACCOUNT_KEY:', error);
    throw new Error('Invalid SERVICE_ACCOUNT_KEY format - must be valid JSON');
  }
};

// Initialize Firebase Admin only once
const initAdmin = () => {
  const apps = getApps();
  
  if (apps.length > 0) {
    return apps[0];
  }
  
  const serviceAccount = firebaseAdminConfig();
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'heartlink-f4ftq.firebasestorage.app';
  
  console.log(`Initializing Firebase Admin with bucket: ${storageBucket}`);
  
  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: storageBucket 
  });
};

// Get the bucket instance
export const getStorageBucket = () => {
  try {
    const app = initAdmin();
    const storage = getStorage(app);
    return storage.bucket(); 
  } catch (error) {
    console.error('Error getting storage bucket:', error);
    throw new Error('Failed to initialize Firebase Storage. Check your credentials and bucket configuration.');
  }
};
