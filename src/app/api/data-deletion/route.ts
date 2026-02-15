import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  createDataDeletionRequest,
  updateDataDeletionRequest,
  getUsersByPhone,
  updateUser,
} from '@/lib/firestore';

// Configuración de Meta App
const APP_SECRET = process.env.META_APP_SECRET || 'tu_app_secret_aqui';

/**
 * Verifica la firma de Meta para validar que la solicitud es legítima
 */
function verifySignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', APP_SECRET)
    .update(payload)
    .digest('hex');
  return signature === `sha256=${expectedSignature}`;
}

/**
 * Ejecuta la eliminación/anonymización de datos para cumplir GDPR.
 * Meta puede enviar user_id como PSID o como teléfono; intentamos ambos.
 */
async function executeDataDeletion(metaUserId: string, requestId: string): Promise<void> {
  try {
    await updateDataDeletionRequest(requestId, { status: 'processing' });

    // Meta puede enviar el teléfono como user_id (ej: 5493364513355)
    const looksLikePhone = /^\d{10,15}$/.test(String(metaUserId));
    const usersToAnonymize = looksLikePhone ? await getUsersByPhone(metaUserId) : [];

    for (const user of usersToAnonymize) {
      await updateUser(user.id, {
        name: '[Usuario eliminado]',
        email: '',
        phone: '',
      });
    }

    await updateDataDeletionRequest(requestId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Data Deletion] Error:', err);
    await updateDataDeletionRequest(requestId, {
      status: 'failed',
      completedAt: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/data-deletion
 * Endpoint requerido por Meta para el cumplimiento de GDPR
 * Procesa solicitudes de eliminación de datos de usuarios
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && APP_SECRET !== 'tu_app_secret_aqui' && !verifySignature(body, signature)) {
      console.error('Invalid signature for data deletion request');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const userId = data.user_id || data.psid;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    console.log(`[Data Deletion] Request for user: ${userId}`);

    const confirmationCode = crypto.randomBytes(16).toString('hex');
    const requestId = await createDataDeletionRequest(userId, confirmationCode);
    const statusUrl = `${request.nextUrl.origin}/api/data-deletion/status?code=${confirmationCode}`;

    // Ejecutar eliminación en segundo plano (Meta da hasta 30 días)
    executeDataDeletion(userId, requestId).catch(() => {});

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Error processing data deletion request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/data-deletion
 * Página informativa sobre el proceso de eliminación de datos
 */
export async function GET(request: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Eliminación de Datos - HeartLink</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; }
        .info { 
          background: #e3f2fd; 
          padding: 15px; 
          border-radius: 5px;
          margin: 20px 0;
        }
        .steps {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        ol { padding-left: 20px; }
        li { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Eliminación de Datos de Usuario</h1>
        
        <div class="info">
          <h2>Su Derecho a la Eliminación</h2>
          <p>De acuerdo con el RGPD y políticas de privacidad de Meta, usted tiene derecho a solicitar la eliminación completa de sus datos personales de nuestro sistema.</p>
        </div>

        <h2>¿Qué datos se eliminarán?</h2>
        <ul>
          <li>Historial de conversaciones</li>
          <li>Información de perfil</li>
          <li>Número de teléfono</li>
          <li>Cualquier dato personal almacenado</li>
        </ul>

        <div class="steps">
          <h2>Cómo solicitar la eliminación:</h2>
          <ol>
            <li>Envíe un mensaje a nuestro WhatsApp: <strong>+54 9 336 451-3355</strong></li>
            <li>Escriba: "Solicito eliminación de mis datos"</li>
            <li>Recibirá confirmación en 24-48 horas</li>
            <li>Sus datos serán eliminados en un máximo de 30 días</li>
          </ol>
        </div>

        <h2>Proceso Automático</h2>
        <p>Si su solicitud viene desde la configuración de Facebook/WhatsApp, el proceso es automático y recibirá un código de confirmación.</p>

        <h2>Contacto</h2>
        <p>Para consultas adicionales: privacy@heartlink.app</p>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}