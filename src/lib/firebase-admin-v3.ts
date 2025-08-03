import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin configuration specifically for App Hosting using FIREBASE_CONFIG
export function initializeFirebaseAdmin() {
  console.log('🔍 [Firebase Admin v3] Starting initialization for App Hosting...');
  
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log('✅ [Firebase Admin v3] Already initialized');
    return existingApps[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'heartlink-f4ftq';
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'heartlink-f4ftq.firebasestorage.app';

  console.log(`🔍 [Firebase Admin v3] Project: ${projectId}, Bucket: ${storageBucket}`);
  console.log(`🔍 [Firebase Admin v3] Available env vars: ${Object.keys(process.env).filter(k => k.includes('FIREBASE')).join(', ')}`);

  // Method 1: Use FIREBASE_CONFIG (App Hosting provides this)
  const tryFirebaseConfig = () => {
    console.log('🔍 [Firebase Admin v3] Trying FIREBASE_CONFIG...');
    
    const firebaseConfig = process.env.FIREBASE_CONFIG;
    if (firebaseConfig) {
      console.log('✅ [Firebase Admin v3] FIREBASE_CONFIG found');
      try {
        // FIREBASE_CONFIG contains project info, use it with default credentials
        return initializeApp({
          projectId: projectId,
          storageBucket: storageBucket
        });
      } catch (error) {
        console.error('❌ [Firebase Admin v3] FIREBASE_CONFIG method failed:', error);
        return null;
      }
    }
    
    console.log('❌ [Firebase Admin v3] FIREBASE_CONFIG not available');
    return null;
  };

  // Method 2: Try with explicit project config for App Hosting
  const tryAppHostingDefaults = () => {
    console.log('🔍 [Firebase Admin v3] Trying App Hosting defaults...');
    
    try {
      // For App Hosting, Firebase provides automatic credentials
      return initializeApp({
        projectId: 'heartlink-f4ftq',  // Hardcoded for App Hosting
        storageBucket: 'heartlink-f4ftq.firebasestorage.app'
      });
    } catch (error) {
      console.error('❌ [Firebase Admin v3] App Hosting defaults failed:', error);
      return null;
    }
  };

  // Method 3: Try service account if somehow available
  const tryServiceAccountFromEnv = () => {
    console.log('🔍 [Firebase Admin v3] Trying service account from environment...');
    
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.log('❌ [Firebase Admin v3] No service account key found');
      return null;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountKey) as ServiceAccount;
      console.log(`✅ [Firebase Admin v3] Service account parsed: ${serviceAccount.client_email}`);
      
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
        storageBucket: storageBucket
      });
    } catch (error) {
      console.error('❌ [Firebase Admin v3] Service account parsing failed:', error);
      return null;
    }
  };

  // Try methods in order of likelihood for App Hosting
  let app = tryFirebaseConfig();
  
  if (!app) {
    app = tryAppHostingDefaults();
  }
  
  if (!app) {
    app = tryServiceAccountFromEnv();
  }

  if (!app) {
    const errorMsg = 'Failed to initialize Firebase Admin - App Hosting credentials not available';
    console.error(`❌ [Firebase Admin v3] ${errorMsg}`);
    console.error(`📊 [Firebase Admin v3] Environment debug:`, {
      nodeEnv: process.env.NODE_ENV,
      hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
      availableKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('SERVICE'))
    });
    throw new Error(errorMsg);
  }

  console.log('✅ [Firebase Admin v3] Successfully initialized for App Hosting');
  return app;
}

// Enhanced storage bucket getter for App Hosting
export function getStorageBucket() {
  try {
    console.log('🔍 [Storage v3] Getting storage bucket for App Hosting...');
    
    const app = initializeFirebaseAdmin();
    const storage = getStorage(app);
    const bucket = storage.bucket();
    
    console.log('✅ [Storage v3] Storage bucket obtained successfully');
    return bucket;
  } catch (error) {
    console.error('❌ [Storage v3] Failed to get storage bucket:', error);
    
    // Detailed error for App Hosting debugging
    const errorDetails = {
      message: error?.message || 'Unknown error',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
        hasServiceKey: !!process.env.SERVICE_ACCOUNT_KEY,
        availableFirebaseKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE')),
        allKeys: Object.keys(process.env)
      }
    };
    
    console.error('📊 [Storage v3] App Hosting error details:', JSON.stringify(errorDetails, null, 2));
    
    throw new Error(`Firebase Storage initialization failed in App Hosting: ${error?.message || 'Unknown error'}`);
  }
}