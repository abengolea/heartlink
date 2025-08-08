import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/services/whatsapp';
import { handleWhatsAppMessage } from '@/services/whatsapp-handler';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify webhook (WhatsApp requirement)
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  console.log('❌ WhatsApp webhook verification failed');
  return new Response('Verification failed', { status: 403 });
}

export async function POST(request: Request) {
  console.log('📱 [WhatsApp Webhook] Received message');
  
  try {
    const body = await request.json();
    console.log('📱 [WhatsApp Webhook] Body:', JSON.stringify(body, null, 2));

    // Extract message data from WhatsApp webhook
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    const contacts = value?.contacts;

    if (!messages || messages.length === 0) {
      console.log('📱 [WhatsApp Webhook] No messages in webhook');
      return NextResponse.json({ status: 'ok' });
    }

    const message = messages[0];
    const contact = contacts?.[0];
    
    console.log('📱 [WhatsApp Webhook] Processing message:', {
      from: message.from,
      type: message.type,
      messageId: message.id,
      contactName: contact?.profile?.name
    });

    // Handle the message (video, text, etc.)
    await handleWhatsAppMessage({
      messageId: message.id,
      from: message.from,
      contactName: contact?.profile?.name || 'Doctor',
      message: message,
      timestamp: message.timestamp
    });

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('❌ [WhatsApp Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}