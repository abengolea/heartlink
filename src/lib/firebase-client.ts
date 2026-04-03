// Firebase Client Configuration (for frontend authentication)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { sanitizeFirebaseEnvString } from '@/lib/sanitize-firebase-env';

const firebaseConfig = {
  apiKey: sanitizeFirebaseEnvString(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitizeFirebaseEnvString(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeFirebaseEnvString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeFirebaseEnvString(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeFirebaseEnvString(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeFirebaseEnvString(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// DIAGNÓSTICO TEMPORAL — borrar luego del fix
console.log('[HeartLink Firebase Config]', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 8)}...` : '⚠️ UNDEFINED/EMPTY',
  authDomain: firebaseConfig.authDomain ?? '⚠️ UNDEFINED/EMPTY',
  projectId: firebaseConfig.projectId ?? '⚠️ UNDEFINED/EMPTY',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 12)}...` : '⚠️ UNDEFINED/EMPTY',
  messagingSenderId: firebaseConfig.messagingSenderId ?? '⚠️ UNDEFINED/EMPTY',
});

// Initialize Firebase app (client-side)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Google login error:', error);
    return { success: false, error: error.message };
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Login vía backend: establece cookie de sesión httpOnly (createSessionCookie)
 * para no depender de signInWithCustomToken ni de identitytoolkit desde el navegador.
 */
export const loginWithEmailViaBackend = async (email: string, password: string) => {
  try {
    const res = await fetch('/api/auth/login-via-backend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Error al iniciar sesión' };
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('heartlink-auth-session'));
    }
    return { success: true, user: null };
  } catch (error: any) {
    console.error('Login via backend error:', error);
    return { success: false, error: error.message };
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Recuperar contraseña vía backend: genera una nueva contraseña,
 * la actualiza en Firebase Auth y envía un email con ella vía Firestore Trigger Email (Gmail).
 */
export const resetPasswordViaBackend = async (email: string) => {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Error al procesar la solicitud' };
    }
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error('Reset via backend error:', error);
    return { success: false, error: error.message };
  }
};

export default app;