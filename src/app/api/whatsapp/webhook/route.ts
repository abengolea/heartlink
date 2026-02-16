import { NextResponse } from 'next/server';
import { parseWebhookPayload } from '@/lib/whatsapp/parseWebhook';
import { handleWhatsAppMessage } from '@/services/whatsapp-handler';
import { upsertWhatsAppContact } from '@/lib/firestore/upsertWhatsAppContact';

export const runtime = 'nodejs';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'heartlink_webhook_2025';

/**
 * GET - Verificación del webhook por Meta
 * Meta envía hub.mode, hub.verify_token, hub.challenge para validar la URL
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const expectedToken = VERIFY_TOKEN?.trim();
    if (!expectedToken) {
      console.error('[WhatsApp Webhook] WHATSAPP_VERIFY_TOKEN no configurado');
      return new Response('Server misconfiguration', { status: 500 });
    }

    if (mode === 'subscribe' && token === expectedToken) {
      return new Response(challenge ?? '', { status: 200 });
    }

    return new Response('Verification failed', { status: 403 });
  } catch (error) {
    console.error('[WhatsApp Webhook] GET error:', error instanceof Error ? error.message : error);
    return new Response('Verification failed', { status: 403 });
  }
}

/**
 * POST - Recepción de eventos de WhatsApp Cloud API
 * Responde 200 OK rápidamente (<5s) para evitar que Meta corte la conexión.
 * El procesamiento se ejecuta en background.
 */
export async function POST(request: Request): Promise<Response> {
  console.log('\n========== [WhatsApp Webhook] POST RECIBIDO ==========');
  let rawBody: string;
  try {
    rawBody = await request.text();
    console.log('[WhatsApp Webhook] Body length:', rawBody?.length, 'hasEntry:', rawBody?.includes('"entry"'));
  } catch (error) {
    console.error('[WhatsApp Webhook] Error reading body:', error instanceof Error ? error.message : error);
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    console.error('[WhatsApp Webhook] Invalid JSON payload');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  const parsed = parseWebhookPayload(body);

  if (!parsed) {
    const v = (body as { entry?: { changes?: { value?: { messages?: unknown; statuses?: unknown } }[] }[] })?.entry?.[0]?.changes?.[0]?.value;
    console.log('[WhatsApp Webhook] Payload sin mensaje procesable', {
      hasMessages: !!v?.messages,
      hasStatuses: !!v?.statuses,
    });
  }

  if (parsed) {
    console.log('[WhatsApp Webhook] Message received', {
      userPhone: parsed.userPhone,
      messageId: parsed.messageId,
      messageType: parsed.messageType,
      messagePreview: parsed.message.slice(0, 50),
      hasVideo: !!(parsed.rawMessage as { video?: unknown })?.video,
    });

    // Procesamiento en background - NO await para responder 200 rápido
    const contactName = parsed.contactName ?? 'Unknown';
    const handlerPayload = {
      messageId: parsed.messageId,
      from: parsed.userPhone,
      contactName,
      message: parsed.rawMessage,
      timestamp: String(parsed.timestamp),
    };

    void upsertWhatsAppContact(parsed.userPhone).catch(() => {});
    void handleWhatsAppMessage(handlerPayload).catch((err) => {
      console.error('[WhatsApp Webhook] Handler error:', err instanceof Error ? err.message : err);
    });
  }
  // status updates, delivery receipts, etc. → no loguear, solo 200

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
