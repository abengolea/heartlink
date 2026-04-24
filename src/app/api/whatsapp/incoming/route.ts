import { NextResponse } from 'next/server';
import { handleWhatsAppMessage, UserNotRegisteredError } from '@/services/whatsapp-handler';

/**
 * POST: Recibe mensajes de WhatsApp reenviados desde NotificasHub.
 * NotificasHub recibe el webhook de Meta y reenvía aquí para procesamiento.
 * Requiere INTERNAL_SECRET en header x-internal-token.
 */
export async function POST(req: Request) {
  const token = req.headers.get('x-internal-token');
  const hasSecret = !!process.env.INTERNAL_SECRET;
  if (!hasSecret || token !== process.env.INTERNAL_SECRET) {
    console.warn('[whatsapp/incoming] 401 Unauthorized', {
      hasToken: !!token,
      hasSecret,
      tokenMatch: hasSecret && token === process.env.INTERNAL_SECRET,
    });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { message?: unknown; from?: string };
  try {
    body = await req.json();
  } catch (e) {
    console.error('[whatsapp/incoming] Invalid JSON:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message: rawMessage, from, contactName, messageId, timestamp } = body;
  // Algunos routers envían el mensaje anidado en message.message
  const message = (rawMessage as { message?: unknown })?.message ?? rawMessage;
  const fromResolved = from ?? (message as { from?: string })?.from;
  const msgType = (message as { type?: string })?.type ?? 'unknown';
  console.log('[whatsapp/incoming] Request received', { from: fromResolved, msgType, hasContacts: !!(message as { contacts?: unknown })?.contacts });

  if (!fromResolved || !message) {
    return NextResponse.json(
      { error: 'Missing required fields: from, message' },
      { status: 400 }
    );
  }

  const payload = {
    messageId: messageId ?? (message as { id?: string })?.id ?? `incoming-${Date.now()}`,
    from: String(fromResolved),
    contactName: contactName ?? 'Unknown',
    message: message as Parameters<typeof handleWhatsAppMessage>[0]['message'],
    timestamp: String(timestamp ?? (message as { timestamp?: string })?.timestamp ?? Date.now()),
  };

  try {
    await handleWhatsAppMessage(payload);
    console.log('[whatsapp/incoming] Processed OK', { from: fromResolved });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UserNotRegisteredError) {
      console.log('[whatsapp/incoming] User not registered → 404 para fallback en hub', { from: fromResolved });
      return NextResponse.json({ error: 'user_not_registered' }, { status: 404 });
    }
    console.error('[whatsapp/incoming] Handler error:', error);
    return NextResponse.json(
      { error: 'Handler failed', ok: false },
      { status: 500 }
    );
  }
}
