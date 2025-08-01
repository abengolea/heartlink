import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

let firebaseAdminApp: App | undefined;

function getFirebaseAdmin(): App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }
  
  const apps = getApps();
  if (apps.length > 0) {
    firebaseAdminApp = apps[0];
    return firebaseAdminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    if (!serviceAccount.project_id) {
      throw new Error("Invalid service account: missing project_id");
    }

    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    }, 'admin-app-' + new Date().getTime()); // Unique app name to avoid conflicts
    
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }

  return firebaseAdminApp;
}

// Función helper para obtener el bucket
export function getStorageBucket() {
  const app = getFirebaseAdmin();
  const storage = getStorage(app);
  
  // Usar el bucket configurado en la app
  return storage.bucket();
}

// Exportar solo lo necesario
export { getFirebaseAdmin };
