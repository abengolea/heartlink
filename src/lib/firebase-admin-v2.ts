import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Enhanced Firebase Admin configuration for App Hosting
export function initializeFirebaseAdmin() {
  console.log('🔍 [Firebase Admin] Starting initialization...');
  
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log('✅ [Firebase Admin] Already initialized');
    return existingApps[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'heartlink-f4ftq';
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'heartlink-f4ftq.firebasestorage.app';

  console.log(`🔍 [Firebase Admin] Project: ${projectId}, Bucket: ${storageBucket}`);

  // Method 1: Try service account from environment
  const tryServiceAccountFromEnv = () => {
    console.log('🔍 [Firebase Admin] Trying service account from environment...');
    
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.log('❌ [Firebase Admin] No service account key found in environment');
      return null;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountKey) as ServiceAccount;
      console.log(`✅ [Firebase Admin] Service account parsed: ${serviceAccount.client_email}`);
      
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
        storageBucket: storageBucket
      });
    } catch (error) {
      console.error('❌ [Firebase Admin] Service account parsing failed:', error);
      return null;
    }
  };

  // Method 2: Try default credentials (for App Hosting)
  const tryDefaultCredentials = () => {
    console.log('🔍 [Firebase Admin] Trying default credentials...');
    
    try {
      return initializeApp({
        projectId: projectId,
        storageBucket: storageBucket
      });
    } catch (error) {
      console.error('❌ [Firebase Admin] Default credentials failed:', error);
      return null;
    }
  };

  // Try methods in order
  let app = tryServiceAccountFromEnv();
  
  if (!app) {
    app = tryDefaultCredentials();
  }

  if (!app) {
    const errorMsg = 'Failed to initialize Firebase Admin with any method';
    console.error(`❌ [Firebase Admin] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  console.log('✅ [Firebase Admin] Successfully initialized');
  return app;
}

// Safe storage bucket getter with detailed error handling
export function getStorageBucket() {
  try {
    console.log('🔍 [Storage] Getting storage bucket...');
    
    const app = initializeFirebaseAdmin();
    const storage = getStorage(app);
    const bucket = storage.bucket();
    
    console.log('✅ [Storage] Storage bucket obtained successfully');
    return bucket;
  } catch (error) {
    console.error('❌ [Storage] Failed to get storage bucket:', error);
    
    // Provide detailed error information
    const errorDetails = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace',
      environment: {
        hasServiceAccountKey: !!process.env.SERVICE_ACCOUNT_KEY,
        hasFirebaseServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        nodeEnv: process.env.NODE_ENV
      }
    };
    
    console.error('📊 [Storage] Error details:', JSON.stringify(errorDetails, null, 2));
    
    throw new Error(`Firebase Storage initialization failed: ${error?.message || 'Unknown error'}`);
  }
}