import { NextResponse } from 'next/server';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function POST(request: Request) {
  console.log('🔍 [WhatsApp Debug] Starting detailed debugging...');
  
  try {
    const body = await request.json();
    const { to } = body;
    
    if (!to) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Log environment variables (safely)
    console.log('🔍 [Debug] PHONE_NUMBER_ID:', PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing');
    console.log('🔍 [Debug] ACCESS_TOKEN:', ACCESS_TOKEN ? '✅ Set (length: ' + ACCESS_TOKEN.length + ')' : '❌ Missing');
    
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          phoneNumberId: PHONE_NUMBER_ID ? 'Set' : 'Missing',
          accessToken: ACCESS_TOKEN ? 'Set' : 'Missing'
        }
      }, { status: 500 });
    }

    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
    const headers = {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
    const requestBody = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: '🔍 DEBUG: Test message from HeartLink system'
      }
    };

    console.log('🔍 [Debug] Request URL:', url);
    console.log('🔍 [Debug] Request headers:', { ...headers, Authorization: 'Bearer ***' });
    console.log('🔍 [Debug] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    console.log('🔍 [Debug] Response status:', response.status);
    console.log('🔍 [Debug] Response body:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      debug: true,
      request: {
        url: url,
        method: 'POST',
        headers: { ...headers, Authorization: 'Bearer ***' },
        body: requestBody
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        body: result
      },
      environment: {
        phoneNumberId: PHONE_NUMBER_ID,
        accessTokenLength: ACCESS_TOKEN?.length,
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('🔍 [Debug] Error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'WhatsApp Debug endpoint ready',
    usage: 'POST with { "to": "+5493364513355" }'
  });
}