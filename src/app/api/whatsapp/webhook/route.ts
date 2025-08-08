import { NextResponse } from 'next/server';
import { handleWhatsAppMessage } from '@/services/whatsapp-handler';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('🔍 [WhatsApp Webhook] GET verification request:', { mode, token, challenge });

  if (mode === 'subscribe' && token === 'heartlink_webhook_2025') {
    console.log('✅ [WhatsApp Webhook] Verification successful');
    return new Response(challenge, { status: 200 });
  }

  console.log('❌ WhatsApp webhook verification failed');
  return new Response('Verification failed', { status: 403 });
}

export async function POST(request: Request) {
  console.log('🚨 [WhatsApp Webhook] POST REQUEST RECEIVED!!!');
  console.log('🚨 [WhatsApp Webhook] Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const rawBody = await request.text();
    console.log('🚨 [WhatsApp Webhook] Raw body received:', rawBody);
    
    const body = JSON.parse(rawBody);
    console.log('🚨 [WhatsApp Webhook] Parsed body:', JSON.stringify(body, null, 2));

    // Extract message data from WhatsApp webhook
    const entry = body.entry?.[0];
    console.log('🚨 [WhatsApp Webhook] Entry:', JSON.stringify(entry, null, 2));
    
    const changes = entry?.changes?.[0];
    console.log('🚨 [WhatsApp Webhook] Changes:', JSON.stringify(changes, null, 2));
    
    const value = changes?.value;
    console.log('🚨 [WhatsApp Webhook] Value:', JSON.stringify(value, null, 2));
    
    const messages = value?.messages;
    const contacts = value?.contacts;

    console.log('🚨 [WhatsApp Webhook] Messages:', JSON.stringify(messages, null, 2));
    console.log('🚨 [WhatsApp Webhook] Contacts:', JSON.stringify(contacts, null, 2));

    if (!messages || messages.length === 0) {
      console.log('📱 [WhatsApp Webhook] No messages in webhook - might be status update');
      return NextResponse.json({ status: 'ok' });
    }

    const message = messages[0];
    const contact = contacts?.[0];
    
    console.log('🚨 [WhatsApp Webhook] Processing message:', JSON.stringify(message, null, 2));
    console.log('🚨 [WhatsApp Webhook] Contact info:', JSON.stringify(contact, null, 2));

    const whatsappMessage = {
      messageId: message.id,
      from: message.from,
      contactName: contact?.profile?.name || 'Unknown',
      message: message,
      timestamp: message.timestamp
    };

    console.log('🚨 [WhatsApp Webhook] Calling handleWhatsAppMessage with:', JSON.stringify(whatsappMessage, null, 2));

    await handleWhatsAppMessage(whatsappMessage);
    
    console.log('✅ [WhatsApp Webhook] Message processed successfully');
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('❌ [WhatsApp Webhook] Error processing webhook:', error);
    console.error('❌ [WhatsApp Webhook] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Always return 200 to prevent Meta from retrying
    return NextResponse.json({ status: 'error', message: 'Internal error' }, { status: 200 });
  }
}