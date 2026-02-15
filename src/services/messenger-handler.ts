/**
 * Messenger Handler - Procesa mensajes entrantes de Facebook Messenger
 */

import { sendMessengerText } from './messenger-send';

export interface MessengerHandlerPayload {
  senderId: string;
  recipientId: string;
  message: string;
  messageId: string;
  timestamp: number;
}

const GREETING_MESSAGE = `👋 Hola! Soy HeartLink.
Recibimos tu mensaje correctamente.`;

export async function handleMessengerMessage(payload: MessengerHandlerPayload): Promise<void> {
  const { senderId } = payload;

  try {
    console.log('[Messenger Handler] Mensaje recibido', {
      senderId,
      messageId: payload.messageId,
    });

    const sent = await sendMessengerText(senderId, GREETING_MESSAGE);

    if (sent) {
      console.log('[Messenger Handler] Respuesta enviada a', senderId);
    } else {
      console.error('[Messenger Handler] No se pudo enviar respuesta a', senderId);
    }
  } catch (error) {
    console.error('[Messenger Handler] Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}
