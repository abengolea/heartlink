import { cert, getApps, initializeApp, ServiceAccount, applicationDefault } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin only once
const initAdmin = () => {
  const apps = getApps();
  
  if (apps.length > 0) {
    return apps[0];
  }
  
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'heartlink-f4ftq.firebasestorage.app';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'heartlink-f4ftq';
  
  console.log(`Initializing Firebase Admin with bucket: ${storageBucket}`);
  
  // Try Application Default Credentials first (for App Hosting)
  try {
    console.log('Attempting to use Application Default Credentials...');
    return initializeApp({
      credential: applicationDefault(),
      storageBucket: storageBucket,
      projectId: projectId
    });
  } catch (adcError) {
    console.log('ADC not available, trying service account key...');
    
    // Fallback to service account key
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.error('Available env vars:', Object.keys(process.env).filter(k => 
        k.includes('FIREBASE') || k.includes('SERVICE')
      ));
      throw new Error('No Firebase credentials available. Check FIREBASE_SERVICE_ACCOUNT_KEY or SERVICE_ACCOUNT_KEY environment variable.');
    }
    
    try {
      const serviceAccount = JSON.parse(serviceAccountKey) as ServiceAccount;
      console.log('Service account parsed successfully, project:', serviceAccount.project_id);
      
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: storageBucket
      });
    } catch (parseError) {
      console.error('Error parsing service account JSON:', parseError);
      throw new Error('Invalid service account JSON format');
    }
  }
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
