import { NextResponse } from 'next/server';
import { getStorageBucket } from '@/lib/firebase-admin';

export async function GET() {
  try {
    console.log('Iniciando prueba de conexión al bucket...');
    const bucket = getStorageBucket();
    const [exists] = await bucket.exists();

    if (exists) {
      console.log('✅ ¡Éxito! Conexión al bucket "' + bucket.name + '" establecida.');
      return NextResponse.json({
        status: 'success',
        message: '¡Conexión exitosa!',
        bucketName: bucket.name,
      });
    } else {
      console.error('❌ Error: El bucket "' + bucket.name + '" no fue encontrado.');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Error de configuración.',
          error: `Se pudo conectar a Firebase, pero el bucket "${bucket.name}" no existe. Verifica el nombre en la consola de Google Cloud.`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Falló la prueba de conexión al bucket:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'No se pudo conectar al bucket de Firebase Storage.',
        error: error.message,
        suggestion: 'Verifica que la variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY sea correcta y que la cuenta de servicio tenga los permisos "Storage Admin" o "Storage Object Admin" en Google Cloud IAM.',
      },
      { status: 500 }
    );
  }
}
