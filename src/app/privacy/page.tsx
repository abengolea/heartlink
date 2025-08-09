'use client';

export default function PrivacyPolicy() {
  return (
    <>
      <style jsx>{`
        .container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #34495e;
          margin-top: 30px;
        }
        .date {
          color: #7f8c8d;
          font-style: italic;
        }
        ul {
          padding-left: 30px;
        }
        li {
          margin: 10px 0;
        }
        body {
          background: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
      `}</style>
      
      <div className="container">
        <h1>Política de Privacidad</h1>
        <p className="date">Última actualización: Enero 2025</p>

        <h2>1. Información que Recopilamos</h2>
        <p>HeartLink recopila la siguiente información a través de WhatsApp Business API:</p>
        <ul>
          <li>Número de teléfono</li>
          <li>Nombre de perfil de WhatsApp</li>
          <li>Mensajes enviados y recibidos</li>
          <li>Metadatos de conversación (fecha, hora)</li>
        </ul>

        <h2>2. Uso de la Información</h2>
        <p>Utilizamos la información recopilada para:</p>
        <ul>
          <li>Proporcionar respuestas automatizadas a través de nuestro servicio</li>
          <li>Mejorar la calidad de nuestras respuestas</li>
          <li>Mantener registros de conversación para continuidad del servicio</li>
          <li>Análisis estadísticos agregados y anónimos</li>
        </ul>

        <h2>3. Protección de Datos</h2>
        <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información:</p>
        <ul>
          <li>Encriptación de datos en tránsito y reposo</li>
          <li>Acceso restringido a información personal</li>
          <li>Servidores seguros con Firebase/Google Cloud</li>
          <li>Cumplimiento con estándares de seguridad de Meta/WhatsApp</li>
        </ul>

        <h2>4. Compartir Información</h2>
        <p>NO vendemos, alquilamos ni compartimos su información personal con terceros, excepto:</p>
        <ul>
          <li>Cuando sea requerido por ley</li>
          <li>Para proteger nuestros derechos legales</li>
          <li>Con proveedores de servicios esenciales (hosting, etc.) bajo acuerdos de confidencialidad</li>
        </ul>

        <h2>5. Retención de Datos</h2>
        <p>Conservamos su información durante el tiempo necesario para proporcionar el servicio. Los mensajes se eliminan automáticamente después de 30 días, salvo que usted solicite lo contrario.</p>

        <h2>6. Sus Derechos</h2>
        <p>Usted tiene derecho a:</p>
        <ul>
          <li>Acceder a su información personal</li>
          <li>Corregir datos inexactos</li>
          <li>Solicitar la eliminación de sus datos</li>
          <li>Oponerse al procesamiento de sus datos</li>
          <li>Portabilidad de datos</li>
        </ul>

        <h2>7. Uso de WhatsApp</h2>
        <p>Este servicio utiliza WhatsApp Business API. Al usar nuestro servicio, también acepta los términos y políticas de privacidad de WhatsApp/Meta.</p>

        <h2>8. Cambios a esta Política</h2>
        <p>Podemos actualizar esta política periódicamente. Los cambios serán publicados en esta página con la fecha de actualización.</p>

        <h2>9. Contacto</h2>
        <p>Para consultas sobre privacidad o ejercer sus derechos, contáctenos a través de:</p>
        <ul>
          <li>WhatsApp: +54 9 336 451-3355</li>
          <li>Email: privacy@heartlink.app</li>
        </ul>

        <h2>10. Base Legal</h2>
        <p>Procesamos su información basándonos en:</p>
        <ul>
          <li>Su consentimiento al iniciar conversación con nuestro bot</li>
          <li>Necesidad contractual para proporcionar el servicio</li>
          <li>Intereses legítimos para mejorar nuestros servicios</li>
        </ul>
      </div>
    </>
  );
}