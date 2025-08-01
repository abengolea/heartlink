// lib/emailService.js - Usando la extensión de Firebase
import { addDoc, collection, getFirestore } from 'firebase/firestore';

// Obtener la base de datos correcta
const db = getFirestore(); // Si usas la base por defecto
// O si usas una base específica: const db = getFirestore(app, 'tu-base-iowa');

// Función básica para enviar email
export const sendEmail = async (to, subject, message, html = null) => {
  try {
    const emailDoc = {
      to: to,
      message: {
        subject: subject,
        text: message,
        ...(html && { html: html })
      }
    };

    const docRef = await addDoc(collection(db, 'mail'), emailDoc);
    console.log('✅ Email programado:', docRef.id);
    
    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('❌ Error programando email:', error);
    return { success: false, error: error.message };
  }
};

// Función para múltiples destinatarios
export const sendBulkEmail = async (recipients, subject, message, html = null) => {
  try {
    const emailDoc = {
      to: recipients, // Array: ['email1@gmail.com', 'email2@gmail.com']
      message: {
        subject: subject,
        text: message,
        ...(html && { html: html })
      }
    };

    const docRef = await addDoc(collection(db, 'mail'), emailDoc);
    return { success: true, docId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Email con copia y copia oculta
export const sendEmailWithCC = async (to, cc, bcc, subject, message, html = null) => {
  try {
    const emailDoc = {
      to: to,
      cc: cc, // Opcional
      bcc: bcc, // Opcional
      message: {
        subject: subject,
        text: message,
        ...(html && { html: html })
      }
    };

    const docRef = await addDoc(collection(db, 'mail'), emailDoc);
    return { success: true, docId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Email con template HTML personalizado
export const sendTemplateEmail = async (to, subject, templateData) => {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .footer { background-color: #34495e; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #e74c3c; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 10px 0;
        }
        .highlight { background-color: #fffbf0; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❤️ ${templateData.title || 'HeartLink'}</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${templateData.name || 'Usuario'}</strong>,</p>
          <p>${templateData.message}</p>
          
          ${templateData.highlight ? `<div class="highlight">${templateData.highlight}</div>` : ''}
          
          ${templateData.buttonUrl ? 
            `<div style="text-align: center;">
              <a href="${templateData.buttonUrl}" class="button">${templateData.buttonText || 'Ver más'}</a>
            </div>` : ''
          }
          
          ${templateData.additionalContent || ''}
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>El equipo de HeartLink</strong>
          </p>
        </div>
        <div class="footer">
          <p>Este email fue enviado desde HeartLink | © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, templateData.message, htmlTemplate);
};

// Email de bienvenida
export const sendWelcomeEmail = async (userEmail, userName) => {
  const templateData = {
    title: '¡Bienvenido a HeartLink!',
    name: userName,
    message: 'Gracias por unirte a nuestra comunidad. Estamos emocionados de tenerte con nosotros.',
    highlight: '🎉 Tu cuenta ha sido creada exitosamente',
    buttonUrl: 'https://heartlink.com/dashboard',
    buttonText: 'Ir a mi Dashboard',
    additionalContent: `
      <h3>¿Qué puedes hacer ahora?</h3>
      <ul>
        <li>Completar tu perfil</li>
        <li>Conectar con otros usuarios</li>
        <li>Explorar las funcionalidades</li>
      </ul>
    `
  };

  return await sendTemplateEmail(userEmail, '¡Bienvenido a HeartLink! 🎉', templateData);
};

// Email de recuperación de contraseña
export const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const resetUrl = `https://heartlink.com/reset-password?token=${resetToken}`;
  
  const templateData = {
    title: 'Recuperar Contraseña',
    name: 'Usuario',
    message: 'Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar.',
    highlight: '⚠️ Este enlace expira en 1 hora por seguridad',
    buttonUrl: resetUrl,
    buttonText: 'Restablecer mi Contraseña',
    additionalContent: '<p><em>Si no solicitaste este cambio, puedes ignorar este email.</em></p>'
  };

  return await sendTemplateEmail(userEmail, 'Recuperar Contraseña - HeartLink 🔐', templateData);
};

// Email de notificación
export const sendNotificationEmail = async (userEmail, userName, notificationType, data) => {
  const templateData = {
    title: 'Nueva Notificación',
    name: userName,
    message: `Tienes una nueva ${notificationType} en HeartLink.`,
    highlight: data.highlight || 'Revisa tu cuenta para más detalles',
    buttonUrl: data.url || 'https://heartlink.com/notifications',
    buttonText: 'Ver Notificación'
  };

  return await sendTemplateEmail(userEmail, `Nueva ${notificationType} - HeartLink 🔔`, templateData);
};

// Función para verificar estado del email (opcional)
export const checkEmailStatus = async (docId) => {
  try {
    const docRef = doc(db, 'mail', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        status: data.delivery?.state || 'PENDING',
        attempts: data.delivery?.attempts || 0,
        error: data.delivery?.error || null
      };
    }
    
    return { status: 'NOT_FOUND' };
  } catch (error) {
    return { status: 'ERROR', error: error.message };
  }
};