import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/services/whatsapp';

export async function POST(request: Request) {
  console.log('📱 [WhatsApp Test] Testing WhatsApp integration...');
  
  try {
    const body = await request.json();
    const { to, message } = body;
    
    if (!to) {
      return NextResponse.json(
        { error: 'Phone number (to) is required' },
        { status: 400 }
      );
    }

    const testMessage = message || `🎉 ¡Hola! Esta es una prueba del sistema HeartLink.\n\n📱 *Sistema de Estudios Médicos*\n\n🎥 Para subir un estudio, envía un video del estudio cardiológico.\n\n💬 Comandos disponibles:\n• "hola" - Saludo\n• "ayuda" - Información del sistema\n\nSistema funcionando correctamente ✅`;

    const success = await WhatsAppService.sendTextMessage(to, testMessage);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test message sent successfully',
        to: to
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test message' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ [WhatsApp Test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'WhatsApp integration ready',
    endpoints: {
      webhook: '/api/whatsapp/webhook',
      test: '/api/whatsapp/test'
    },
    instructions: {
      webhook_verification: 'Configure webhook URL in Meta Developer Console',
      test_message: 'POST with { "to": "+5491234567890", "message": "optional custom message" }'
    }
  });
}