import { NextResponse } from 'next/server';

export async function GET() {
  // Solo para debugging - ELIMINAR después de resolver el problema
  const envVars = {
    hasServiceAccountKey: !!process.env.SERVICE_ACCOUNT_KEY,
    hasFirebaseServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    nodeEnv: process.env.NODE_ENV,
    availableEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('FIREBASE') || key.includes('SERVICE')
    ),
    serviceAccountKeyLength: process.env.SERVICE_ACCOUNT_KEY?.length || 0,
    firebaseServiceAccountKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0
  };
  
  return NextResponse.json(envVars);
}