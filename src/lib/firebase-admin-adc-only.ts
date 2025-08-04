import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin ADC-ONLY - Para App Hosting sin credenciales manuales
export function initializeFirebaseAdminADCOnly() {
  console.log('🔍 [Firebase Admin ADC-Only] Starting initialization...');
  
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log('✅ [Firebase Admin ADC-Only] Using existing app');
    return existingApps[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'heartlink-f4ftq';
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'heartlink-f4ftq.firebasestorage.app';

  console.log(`🔍 [Firebase Admin ADC-Only] Project: ${projectId}, Bucket: ${storageBucket}`);

  try {
    console.log('🔍 [Firebase Admin ADC-Only] Using ONLY Application Default Credentials...');
    
    // SOLO ADC - NO usar variables de entorno para credenciales
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: projectId,
      storageBucket: storageBucket
    });
    
    console.log('✅ [Firebase Admin ADC-Only] Successfully initialized with ADC only!');
    return app;
    
  } catch (error) {
    console.error('❌ [Firebase Admin ADC-Only] Failed:', error);
    throw new Error(`Cannot initialize Firebase Admin with ADC only: ${error?.message || 'Unknown error'}`);
  }
}

// Storage bucket getter with ADC-only support
export function getStorageBucketADCOnly() {
  try {
    console.log('🔍 [Storage ADC-Only] Getting storage bucket...');
    
    const app = initializeFirebaseAdminADCOnly();
    const storage = getStorage(app);
    const bucket = storage.bucket();
    
    console.log('✅ [Storage ADC-Only] Storage bucket ready');
    return bucket;
    
  } catch (error) {
    console.error('❌ [Storage ADC-Only] Failed to get storage bucket:', error);
    throw new Error(`Firebase Storage ADC-only failed: ${error?.message || 'Unknown error'}`);
  }
}