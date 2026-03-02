/**
 * WhatsApp Cloud API - Envío de mensajes
 * Usa fetch nativo. API v22.0.
 */

const API_BASE = 'https://graph.facebook.com/v22.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;

const BOM = '\uFEFF';

/** Elimina BOM y espacios que pueden venir de copiar/pegar secrets */
function sanitize(str: string | undefined): string {
  return (str ?? '').replace(new RegExp(BOM, 'g'), '').trim();
}

/** Normaliza número para WhatsApp (solo dígitos) */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Envía un mensaje de texto por WhatsApp.
 * @returns true si se envió correctamente, false en caso contrario
 */
export async function sendWhatsAppText(to: string, text: string): Promise<boolean> {
  const phoneNumberId = sanitize(PHONE_NUMBER_ID);
  const token = sanitize(ACCESS_TOKEN);

  if (!phoneNumberId || !token) {
    console.error('[WhatsApp Send] WHATSAPP_PHONE_NUMBER_ID/PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN/WHATSAPP_TOKEN no configurados');
    return false;
  }

  const normalizedTo = normalizePhone(to);
  if (!normalizedTo || normalizedTo.length < 10) {
    console.error('[WhatsApp Send] Número inválido:', to);
    return false;
  }

  try {
    const url = `${API_BASE}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedTo,
        type: 'text',
        text: { body: (text ?? '').replace(/\uFEFF/g, '') },
      }),
    });

    const result = (await response.json()) as { error?: { message?: string }; messages?: Array<{ id?: string }> };

    if (response.ok) {
      console.log('[WhatsApp Send] Mensaje enviado:', result.messages?.[0]?.id ?? 'ok');
      return true;
    }

    console.error('[WhatsApp Send] Error:', result.error?.message ?? JSON.stringify(result));
    return false;
  } catch (error) {
    console.error('[WhatsApp Send] Error de red:', error instanceof Error ? error.message : error);
    return false;
  }
}
