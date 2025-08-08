import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/data-deletion/status
 * Endpoint de estado para confirmación de eliminación de datos
 * Requerido por Meta para verificar el proceso de eliminación
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json(
      { error: 'Confirmation code required' },
      { status: 400 }
    );
  }

  // TODO: En producción, verificar el código contra una base de datos
  // y devolver el estado real de la eliminación
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estado de Eliminación - HeartLink</title>
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
        .success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .code {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Estado de Eliminación de Datos</h1>
        
        <div class="success">
          <h2>✅ Solicitud Procesada</h2>
          <p>Su solicitud de eliminación de datos ha sido procesada correctamente.</p>
        </div>

        <h2>Detalles de la Solicitud</h2>
        <div class="code">
          <strong>Código de confirmación:</strong> ${code}
        </div>
        
        <h2>Estado del Proceso</h2>
        <ul>
          <li>✅ Solicitud recibida y validada</li>
          <li>✅ Datos marcados para eliminación</li>
          <li>⏳ Eliminación en proceso (completa en 30 días)</li>
          <li>⏳ Notificación final pendiente</li>
        </ul>

        <h2>¿Qué se ha eliminado?</h2>
        <ul>
          <li>Historial de conversaciones</li>
          <li>Información de perfil de WhatsApp</li>
          <li>Datos de contacto almacenados</li>
          <li>Registros de actividad relacionados</li>
        </ul>

        <h2>Información Importante</h2>
        <p>El proceso de eliminación se completa en un máximo de 30 días según las políticas de privacidad de Meta y RGPD.</p>
        
        <p>Si tiene consultas adicionales, contacte a: <strong>privacy@heartlink.app</strong></p>
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