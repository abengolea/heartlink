/**
 * Messenger Platform - Webhook payload parser
 * @see https://developers.facebook.com/docs/messenger-platform/webhooks
 */

export interface ParsedMessengerMessage {
  senderId: string;
  recipientId: string;
  message: string;
  messageId: string;
  timestamp: number;
  rawMessage: MessengerWebhookMessage;
}

interface MessengerWebhookMessage {
  mid?: string;
  text?: string;
  attachments?: Array<{ type?: string }>;
  quick_reply?: { payload?: string };
  [key: string]: unknown;
}

interface MessengerWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: MessengerWebhookMessage;
      delivery?: unknown;
      read?: unknown;
      postback?: unknown;
    }>;
  }>;
}

function extractMessageText(msg: MessengerWebhookMessage): string {
  if (msg.text) return msg.text;
  if (msg.quick_reply?.payload) return msg.quick_reply.payload;
  if (msg.attachments?.length) {
    const type = msg.attachments[0]?.type ?? 'attachment';
    return `[${type}]`;
  }
  return '[message]';
}

/**
 * Parsea el payload del webhook de Messenger Platform.
 * @returns Objeto limpio si es un mensaje, null para delivery/read/etc.
 */
export function parseMessengerWebhook(payload: unknown): ParsedMessengerMessage | null {
  try {
    const body = payload as MessengerWebhookPayload;
    if (body?.object !== 'page') return null;

    const entry = body?.entry?.[0];
    const messaging = entry?.messaging;
    if (!messaging?.length) return null;

    const event = messaging[0];
    const message = event?.message;
    if (!message) return null;

    const senderId = String(event?.sender?.id ?? '');
    const recipientId = String(event?.recipient?.id ?? '');
    const messageId = String(message?.mid ?? '');
    const timestamp = Number(event?.timestamp ?? 0);

    if (!senderId) return null;

    return {
      senderId,
      recipientId,
      message: extractMessageText(message),
      messageId,
      timestamp,
      rawMessage: message,
    };
  } catch {
    return null;
  }
}
