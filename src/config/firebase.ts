
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

let app: App;

if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY not set. Please set this environment variable with your service account key JSON.");
        throw new Error("La configuración del servidor de Firebase está incompleta. La clave de la cuenta de servicio no se ha encontrado.");
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        console.log("Initializing Firebase Admin with service account...");
        app = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: 'heartlink-f4ftq.appspot.com'
        });
    } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY or initializing Firebase Admin:", e);
        throw new Error("La clave de la cuenta de servicio de Firebase no es un JSON válido.");
    }
} else {
    app = getApps()[0];
}

const storage = getStorage(app);
export const bucket = storage.bucket('heartlink-f4ftq.appspot.com');
