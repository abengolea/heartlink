import { NextResponse } from 'next/server';
import { parseMessengerWebhook } from '@/lib/messenger/parseWebhook';
import { handleMessengerMessage } from '@/services/messenger-handler';

export const runtime = 'nodejs';

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN;

/**
 * GET - Verificación del webhook por Meta (mismo flujo que WhatsApp)
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const expectedToken = VERIFY_TOKEN?.trim();
    if (!expectedToken) {
      console.error('[Messenger Webhook] MESSENGER_VERIFY_TOKEN o WHATSAPP_VERIFY_TOKEN no configurado');
      return new Response('Server misconfiguration', { status: 500 });
    }

    if (mode === 'subscribe' && token === expectedToken) {
      return new Response(challenge ?? '', { status: 200 });
    }

    return new Response('Verification failed', { status: 403 });
  } catch (error) {
    console.error('[Messenger Webhook] GET error:', error instanceof Error ? error.message : error);
    return new Response('Verification failed', { status: 403 });
  }
}

/**
 * POST - Recepción de eventos de Messenger Platform
 */
export async function POST(request: Request): Promise<Response> {
  console.log('\n========== [Messenger Webhook] POST RECIBIDO ==========');
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error('[Messenger Webhook] Error reading body:', error instanceof Error ? error.message : error);
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    console.error('[Messenger Webhook] Invalid JSON payload');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  const parsed = parseMessengerWebhook(body);

  if (!parsed) {
    console.log('[Messenger Webhook] Payload sin mensaje (delivery/read/etc)');
  }

  if (parsed) {
    console.log('[Messenger Webhook] Message received', {
      senderId: parsed.senderId,
      messageId: parsed.messageId,
      messagePreview: parsed.message.slice(0, 50),
    });

    void handleMessengerMessage(parsed).catch((err) => {
      console.error('[Messenger Webhook] Handler error:', err instanceof Error ? err.message : err);
    });
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
