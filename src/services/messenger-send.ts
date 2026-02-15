/**
 * Messenger Platform - Envío de mensajes
 * @see https://developers.facebook.com/docs/messenger-platform/reference/send-api
 */

const API_BASE = 'https://graph.facebook.com/v22.0';
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

/**
 * Envía un mensaje de texto por Messenger.
 * @param recipientId - PSID (Page-Scoped ID) del usuario
 */
export async function sendMessengerText(recipientId: string, text: string): Promise<boolean> {
  const token = PAGE_ACCESS_TOKEN?.trim();
  if (!token) {
    console.error('[Messenger Send] MESSENGER_PAGE_ACCESS_TOKEN no configurado');
    return false;
  }

  if (!recipientId?.trim()) {
    console.error('[Messenger Send] recipientId inválido');
    return false;
  }

  try {
    const url = `${API_BASE}/me/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text },
      }),
    });

    const result = (await response.json()) as {
      error?: { message?: string };
      recipient_id?: string;
      message_id?: string;
    };

    if (response.ok) {
      console.log('[Messenger Send] Mensaje enviado:', result.message_id ?? 'ok');
      return true;
    }

    console.error('[Messenger Send] Error:', result.error?.message ?? JSON.stringify(result));
    return false;
  } catch (error) {
    console.error('[Messenger Send] Error de red:', error instanceof Error ? error.message : error);
    return false;
  }
}
