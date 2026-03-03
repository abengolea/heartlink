/**
 * Validación de payloads del webhook de WhatsApp Cloud API
 */

import { z } from 'zod';

const textSchema = z.object({ body: z.string() }).passthrough();
const buttonReplySchema = z.object({ id: z.string(), title: z.string() }).passthrough();
const listReplySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
}).passthrough();
const interactiveSchema = z.object({
  type: z.enum(['button_reply', 'list_reply']),
  button_reply: buttonReplySchema.optional(),
  list_reply: listReplySchema.optional(),
}).passthrough();
const referralSchema = z.object({
  type: z.string(),
  source_url: z.string().url().optional(),
  ref: z.string().optional(),
}).passthrough();

export const incomingMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: textSchema.optional(),
  interactive: interactiveSchema.optional(),
  referral: referralSchema.optional(),
  context: z.object({ from: z.string().optional() }).optional(),
}).passthrough();

export type IncomingMessageParsed = z.infer<typeof incomingMessageSchema>;

const changeValueSchema = z.object({
  messaging_product: z.string().optional(),
  metadata: z.object({
    phone_number_id: z.string(),
    display_phone_number: z.string(),
  }).optional(),
  contacts: z.array(z.object({
    profile: z.object({ name: z.string() }).passthrough(),
    wa_id: z.string(),
  })).optional(),
  messages: z.array(incomingMessageSchema).optional(),
  statuses: z.array(z.unknown()).optional(),
}).passthrough();

const changeSchema = z.object({
  value: changeValueSchema,
  field: z.string(),
}).passthrough();

const entrySchema = z.object({
  id: z.string(),
  changes: z.array(changeSchema).optional(),
}).passthrough();

export const webhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(entrySchema).optional(),
}).passthrough();

export type WebhookPayloadParsed = z.infer<typeof webhookPayloadSchema>;

/** Extrae mensajes entrantes del payload para procesamiento */
export function extractIncomingMessages(payload: WebhookPayloadParsed): Array<{
  message: IncomingMessageParsed;
  phoneNumberId: string;
  contactName?: string;
}> {
  const results: Array<{
    message: IncomingMessageParsed;
    phoneNumberId: string;
    contactName?: string;
  }> = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;
      const value = change.value;
      const messages = value.messages ?? [];
      const phoneNumberId = value.metadata?.phone_number_id ?? '';
      const contactName = value.contacts?.[0]?.profile?.name;

      for (const msg of messages) {
        results.push({
          message: msg,
          phoneNumberId,
          contactName,
        });
      }
    }
  }
  return results;
}

/**
 * Parsea el texto de la respuesta para detectar elección 1/2/3
 */
export function parseNumericChoice(text: string): number | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return num >= 1 ? num : null;
}

/**
 * Detecta tokens de referral/prefijado en el texto (RIVER, NAUTICA, etc.)
 */
export function parseReferralToken(text: string, knownTokens: string[]): string | null {
  const upper = text.toUpperCase().trim();
  for (const token of knownTokens) {
    if (upper.includes(token.toUpperCase())) return token;
  }
  return null;
}
