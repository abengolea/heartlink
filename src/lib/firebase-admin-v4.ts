import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
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

  try {
    console.log('🔍 [Firebase Admin v4] Using Application Default Credentials (ADC)...');
    
    // CLAVE: applicationDefault() explícito para Signed URLs
    const app = initializeApp({
      credential: applicationDefault(), // ← ESTO ES CRÍTICO PARA SIGNED URLs
      projectId: projectId,
      storageBucket: storageBucket
    });
    
    console.log('✅ [Firebase Admin v4] Successfully initialized with ADC - Signed URLs should work!');
    return app;
    
  } catch (adcError) {
    console.error('❌ [Firebase Admin v4] ADC failed:', adcError);
    
    // Fallback sin credenciales (NO funcionará para Signed URLs pero puede funcionar para otros casos)
    console.log('🔍 [Firebase Admin v4] Trying fallback without explicit credentials...');
    try {
      const fallbackApp = initializeApp({
        projectId: projectId,
        storageBucket: storageBucket
      });
      
      console.log('⚠️ [Firebase Admin v4] Fallback initialized - Signed URLs may NOT work');
      return fallbackApp;
      
    } catch (fallbackError) {
      console.error('❌ [Firebase Admin v4] All initialization methods failed');
      console.error('ADC Error:', adcError);
      console.error('Fallback Error:', fallbackError);
      throw new Error('Cannot initialize Firebase Admin in App Hosting environment');
    }
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