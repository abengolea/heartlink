/**
 * WhatsApp Cloud API - Webhook payload parser
 * Transforma el payload oficial de Meta en un objeto limpio para logging y procesamiento.
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */

/** Objeto limpio extraído del webhook de WhatsApp */
export interface ParsedWebhookMessage {
  userPhone: string;
  message: string;
  messageId: string;
  timestamp: number;
  phoneNumberId: string;
  /** Tipo de mensaje: text, video, image, audio, document, interactive, etc. */
  messageType: string;
  /** Objeto raw del mensaje para procesamiento posterior (handler, IA) */
  rawMessage: WhatsAppCloudMessage;
  /** Nombre del contacto si viene en el payload */
  contactName?: string;
}

/** Estructura del mensaje según WhatsApp Cloud API */
interface WhatsAppCloudMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  video?: { id: string };
  image?: { id: string };
  audio?: { id: string };
  document?: { id: string };
  interactive?: { type: string; list_reply?: { id: string }; button_reply?: { id: string } };
  [key: string]: unknown;
}

/** Payload raíz del webhook de Meta */
interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string } }>;
        messages?: WhatsAppCloudMessage[];
        statuses?: unknown[];
        errors?: unknown[];
      };
      field?: string;
    }>;
  }>;
}

/**
 * Extrae el body del mensaje según su tipo.
 * Para text: devuelve text.body
 * Para interactive: devuelve el id seleccionado
 * Para otros tipos: devuelve etiqueta descriptiva
 */
function extractMessageBody(msg: WhatsAppCloudMessage): string {
  if (msg.text?.body) return msg.text.body;
  if (msg.interactive?.list_reply?.id) return msg.interactive.list_reply.id;
  if (msg.interactive?.button_reply?.id) return msg.interactive.button_reply.id;
  if (msg.type === 'video') return '[video]';
  if (msg.type === 'image') return '[image]';
  if (msg.type === 'audio') return '[audio]';
  if (msg.type === 'document') return '[document]';
  if (msg.type === 'reaction') return '[reaction]';
  return `[${msg.type ?? 'unknown'}]`;
}

/**
 * Parsea el payload del webhook de WhatsApp Cloud API.
 * @param payload - JSON parseado del body de la request
 * @returns Objeto limpio si es un mensaje válido, null para status updates, receipts, etc.
 */
export function parseWebhookPayload(payload: unknown): ParsedWebhookMessage | null {
  try {
    const body = payload as WhatsAppWebhookPayload;

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return null;

    const phoneNumberId = value.metadata?.phone_number_id ?? '';
    const messages = value.messages;
    const contacts = value.contacts;

    // No es un mensaje entrante: status updates, delivery receipts, etc.
    if (!messages?.length) return null;

    const msg = messages[0] as WhatsAppCloudMessage;
    const from = String(msg?.from ?? '');
    const messageId = String(msg?.id ?? '');
    const timestamp = parseInt(String(msg?.timestamp ?? '0'), 10) || 0;
    const messageType = String(msg?.type ?? 'unknown');
    const contactName = contacts?.[0]?.profile?.name;

    if (!from || !messageId) return null;

    return {
      userPhone: from,
      message: extractMessageBody(msg),
      messageId,
      timestamp,
      phoneNumberId,
      messageType,
      rawMessage: msg,
      contactName,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica si el payload contiene un mensaje procesable (no status/error).
 */
export function hasProcessableMessage(payload: unknown): boolean {
  return parseWebhookPayload(payload) !== null;
}
