import { NextResponse } from 'next/server';
import { handleIncomingMessage } from '@/services/whatsapp-handler';

/**
 * POST: Recibe mensajes de WhatsApp reenviados desde NotificasHub.
 * NotificasHub recibe el webhook de Meta y reenvía aquí para procesamiento.
 * Requiere INTERNAL_SECRET en header x-internal-token.
 */
export async function POST(req: Request) {
  const token = req.headers.get('x-internal-token');
  if (token !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { message?: unknown; from?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, from } = body;
  if (!from || !message) {
    return NextResponse.json(
      { error: 'Missing required fields: from, message' },
      { status: 400 }
    );
  }

  try {
    await handleIncomingMessage(String(from), message as Parameters<typeof handleIncomingMessage>[1]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[whatsapp/incoming] Handler error:', error);
    return NextResponse.json(
      { error: 'Handler failed', ok: false },
      { status: 500 }
    );
  }
}
