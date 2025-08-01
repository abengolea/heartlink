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

// Inicializar Firebase Admin solo una vez
const initAdmin = () => {
  const apps = getApps();
  
  if (apps.length > 0) {
    return apps[0];
  }
  
  const serviceAccount = firebaseAdminConfig();
  
  return initializeApp({
    credential: cert(serviceAccount),
    // Apuntar al bucket correcto especificado por el usuario
    storageBucket: 'videos_heartlink' 
  });
};

// Obtener instancia del bucket
export const getStorageBucket = () => {
  const app = initAdmin();
  const storage = getStorage(app);
  // Usar el bucket por defecto configurado en initializeApp
  return storage.bucket(); 
};
