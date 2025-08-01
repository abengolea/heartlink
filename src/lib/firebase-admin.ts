import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const firebaseAdminConfig = (): ServiceAccount => {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  }
  
  try {
    return JSON.parse(serviceAccountKey) as ServiceAccount;
  } catch (error) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
  }
};

// Initialize Firebase Admin only once
const initAdmin = () => {
  const apps = getApps();
  
  if (apps.length > 0) {
    return apps[0];
  }
  
  const serviceAccount = firebaseAdminConfig();
  
  return initializeApp({
    credential: cert(serviceAccount),
    // Point to the correct bucket specified by the user
    storageBucket: 'videos_heartlink' 
  });
};

// Get the bucket instance
export const getStorageBucket = () => {
  const app = initAdmin();
  const storage = getStorage(app);
  // Use the default bucket configured in initializeApp
  return storage.bucket(); 
};
