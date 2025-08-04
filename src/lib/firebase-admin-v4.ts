import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin v4 - DEFINITIVE solution for App Hosting with Signed URLs
export function initializeFirebaseAdmin() {
  console.log('🔍 [Firebase Admin v4] Starting DEFINITIVE initialization...');
  
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log('✅ [Firebase Admin v4] Using existing app');
    return existingApps[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'heartlink-f4ftq';
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'heartlink-f4ftq.firebasestorage.app';

  console.log(`🔍 [Firebase Admin v4] Project: ${projectId}, Bucket: ${storageBucket}`);

  // Try service account credentials first (if available)
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey && serviceAccountKey !== '{"type":"service_account","project_id":"heartlink-f4ftq","private_key_id":"YOUR_PRIVATE_KEY_ID"' /* incomplete fake key */) {
    try {
      console.log('🔍 [Firebase Admin v4] Using Service Account credentials...');
      
      const serviceAccount = JSON.parse(serviceAccountKey);
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
        storageBucket: storageBucket
      });
      
      console.log('✅ [Firebase Admin v4] Successfully initialized with Service Account!');
      return app;
      
    } catch (serviceAccountError) {
      console.error('❌ [Firebase Admin v4] Service Account failed:', serviceAccountError);
      console.log('🔍 [Firebase Admin v4] Falling back to ADC...');
    }
  } else {
    console.log('🔍 [Firebase Admin v4] No valid service account found, using ADC...');
  }

  try {
    console.log('🔍 [Firebase Admin v4] Using Application Default Credentials (ADC)...');
    
    // Fallback to ADC for App Hosting environment
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: projectId,
      storageBucket: storageBucket
    });
    
    console.log('✅ [Firebase Admin v4] Successfully initialized with ADC!');
    return app;
    
  } catch (adcError) {
    console.error('❌ [Firebase Admin v4] ADC failed:', adcError);
    throw new Error('Cannot initialize Firebase Admin - both Service Account and ADC failed');
  }
}

// Storage bucket getter with ADC support
export function getStorageBucket() {
  try {
    console.log('🔍 [Storage v4] Getting storage bucket with ADC...');
    
    const app = initializeFirebaseAdmin();
    const storage = getStorage(app);
    const bucket = storage.bucket();
    
    console.log('✅ [Storage v4] Storage bucket ready for Signed URLs');
    return bucket;
    
  } catch (error) {
    console.error('❌ [Storage v4] Failed to get storage bucket:', error);
    
    const errorDetails = {
      message: error?.message || 'Unknown error',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        availableKeys: Object.keys(process.env).filter(k => 
          k.includes('FIREBASE') || k.includes('GOOGLE') || k.includes('GCLOUD')
        )
      }
    };
    
    console.error('📊 [Storage v4] Error details:', JSON.stringify(errorDetails, null, 2));
    
    throw new Error(`Firebase Storage with ADC failed: ${error?.message || 'Unknown error'}`);
  }
}