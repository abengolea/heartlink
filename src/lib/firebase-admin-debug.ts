import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const firebaseAdminConfig = (): ServiceAccount => {
  console.log('🔍 DEBUG: Checking SERVICE_ACCOUNT_KEY...');
  
  const serviceAccountKey = process.env.SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.error('❌ SERVICE_ACCOUNT_KEY not found in environment');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SERVICE') || k.includes('FIREBASE')));
    throw new Error('Missing SERVICE_ACCOUNT_KEY environment variable');
  }
  
  console.log('✅ SERVICE_ACCOUNT_KEY found, length:', serviceAccountKey.length);
  
  try {
    const parsed = JSON.parse(serviceAccountKey) as ServiceAccount;
    console.log('✅ JSON parsed successfully');
    console.log('Project ID:', parsed.project_id);
    console.log('Client Email:', parsed.client_email);
    return parsed;
  } catch (error) {
    console.error('❌ Error parsing SERVICE_ACCOUNT_KEY:', error);
    console.error('First 100 chars:', serviceAccountKey.substring(0, 100));
    throw new Error('Invalid SERVICE_ACCOUNT_KEY format - must be valid JSON');
  }
};

// Initialize Firebase Admin only once
const initAdmin = () => {
  console.log('🔍 DEBUG: Initializing Firebase Admin...');
  
  const apps = getApps();
  
  if (apps.length > 0) {
    console.log('✅ Firebase Admin already initialized');
    return apps[0];
  }
  
  try {
    const serviceAccount = firebaseAdminConfig();
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'heartlink-f4ftq.firebasestorage.app';
    
    console.log(`🔍 Initializing with bucket: ${storageBucket}`);
    
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: storageBucket 
    });
    
    console.log('✅ Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    throw error;
  }
};

// Get the bucket instance with debug
export const getStorageBucketDebug = () => {
  try {
    console.log('🔍 DEBUG: Getting storage bucket...');
    const app = initAdmin();
    const storage = getStorage(app);
    const bucket = storage.bucket();
    console.log('✅ Storage bucket obtained successfully');
    return bucket; 
  } catch (error) {
    console.error('❌ Error getting storage bucket:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to initialize Firebase Storage: ${error.message}`);
  }
};