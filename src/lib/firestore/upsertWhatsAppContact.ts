/**
 * Stub: Registro/actualización de contacto de WhatsApp.
 * Por ahora solo loguea. Conectar con Firestore cuando esté listo.
 */

export async function upsertWhatsAppContact(phone: string): Promise<void> {
  const normalized = phone.replace(/\D/g, '');
  if (!normalized) return;

  console.log('[WhatsApp Webhook] contact updated:', { phone: normalized });
}
