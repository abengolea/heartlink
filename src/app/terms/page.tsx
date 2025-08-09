'use client';

export default function TermsOfService() {
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
        .important {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px 15px;
          margin: 20px 0;
        }
        body {
          background: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
      `}</style>
      
      <div className="container">
        <h1>Términos de Servicio</h1>
        <p className="date">Última actualización: Enero 2025</p>

        <h2>1. Aceptación de Términos</h2>
        <p>Al utilizar HeartLink a través de WhatsApp Business, usted acepta estos términos de servicio. Si no está de acuerdo, no utilice nuestro servicio.</p>

        <h2>2. Descripción del Servicio</h2>
        <p>HeartLink es un servicio de chatbot automatizado que proporciona:</p>
        <ul>
          <li>Respuestas automatizadas a consultas</li>
          <li>Asistencia mediante inteligencia artificial</li>
          <li>Procesamiento de mensajes vía WhatsApp Business API</li>
        </ul>

        <h2>3. Uso Aceptable</h2>
        <p>Al usar HeartLink, usted se compromete a:</p>
        <ul>
          <li>NO usar el servicio para actividades ilegales</li>
          <li>NO enviar contenido ofensivo, abusivo o spam</li>
          <li>NO intentar vulnerar la seguridad del sistema</li>
          <li>NO suplantar identidades o engañar a otros usuarios</li>
          <li>Respetar los derechos de propiedad intelectual</li>
        </ul>

        <h2>4. Limitaciones del Servicio</h2>
        <div className="important">
          <strong>Importante:</strong> HeartLink es un servicio automatizado y no reemplaza el consejo profesional médico, legal o financiero.
        </div>
        <ul>
          <li>Las respuestas son generadas por IA y pueden contener errores</li>
          <li>No garantizamos disponibilidad 24/7 del servicio</li>
          <li>El servicio puede ser modificado o discontinuado con previo aviso</li>
        </ul>

        <h2>5. Propiedad Intelectual</h2>
        <p>Todo el contenido, diseño y tecnología de HeartLink son propiedad de sus respectivos dueños:</p>
        <ul>
          <li>El código y sistema son propiedad de HeartLink</li>
          <li>WhatsApp es marca registrada de Meta Platforms, Inc.</li>
          <li>El contenido generado por usuarios permanece propiedad del usuario</li>
        </ul>

        <h2>6. Privacidad y Datos</h2>
        <p>El manejo de sus datos personales está regido por nuestra Política de Privacidad. Al usar el servicio, acepta el procesamiento de datos descrito en dicha política.</p>

        <h2>7. Limitación de Responsabilidad</h2>
        <p>HeartLink no será responsable por:</p>
        <ul>
          <li>Daños indirectos o consecuenciales</li>
          <li>Pérdida de datos o interrupciones del servicio</li>
          <li>Decisiones tomadas basadas en respuestas del bot</li>
          <li>Problemas derivados del uso de WhatsApp</li>
        </ul>

        <h2>8. Indemnización</h2>
        <p>Usted acepta indemnizar y mantener indemne a HeartLink de cualquier reclamo derivado de:</p>
        <ul>
          <li>Su violación de estos términos</li>
          <li>Su uso indebido del servicio</li>
          <li>Violación de derechos de terceros</li>
        </ul>

        <h2>9. Modificaciones</h2>
        <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al ser publicados. El uso continuado del servicio constituye aceptación de los nuevos términos.</p>

        <h2>10. Terminación</h2>
        <p>Podemos terminar o suspender su acceso al servicio:</p>
        <ul>
          <li>Por violación de estos términos</li>
          <li>Por conducta inapropiada o abusiva</li>
          <li>Por requerimiento legal</li>
          <li>A nuestra discreción con notificación previa</li>
        </ul>

        <h2>11. Ley Aplicable</h2>
        <p>Estos términos se rigen por las leyes de Argentina. Cualquier disputa será resuelta en los tribunales competentes de Buenos Aires.</p>

        <h2>12. Contacto</h2>
        <p>Para consultas sobre estos términos:</p>
        <ul>
          <li>WhatsApp: +54 9 336 451-3355</li>
          <li>Email: legal@heartlink.app</li>
        </ul>

        <h2>13. Disposiciones Generales</h2>
        <ul>
          <li>Si alguna cláusula es declarada inválida, las demás permanecerán vigentes</li>
          <li>La falta de ejercicio de un derecho no constituye renuncia al mismo</li>
          <li>Estos términos constituyen el acuerdo completo entre las partes</li>
        </ul>

        <div className="important">
          <strong>Nota:</strong> Al enviar su primer mensaje a nuestro bot de WhatsApp, confirma que ha leído y acepta estos términos de servicio.
        </div>
      </div>
    </>
  );
}