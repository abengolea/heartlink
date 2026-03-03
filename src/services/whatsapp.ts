const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

/** Elimina BOM (U+FEFF) que puede venir de secrets copiados/pegados */
function sanitize(str: string | undefined): string {
  return (str ?? '').replace(/\uFEFF/g, '').trim();
}

export class WhatsAppService {
  
  // Normalize phone number format for WhatsApp API
  // Argentina: 549 + área (2–4 dígitos) + número. Ej: 5493364645357 (549 + 3364 + 645357)
  private static normalizePhoneNumber(phoneNumber: string): string {
    const cleaned = (phoneNumber || '').replace(/\D/g, '');
    console.log(`📱 [WhatsApp] Phone normalized: ${phoneNumber} → ${cleaned}`);
    return cleaned;
  }

  /**
   * Envía mensaje con template documento_disponible.
   * Usar para alcanzar usuarios fuera de la ventana de 24h (regla de WhatsApp).
   */
  static async sendStudyTemplate(to: string, medicoNombre: string, estudio: string, link: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const phoneId = sanitize(process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID);
      const token = sanitize(process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN);
      if (!phoneId || !token) {
        console.error('[WhatsApp] PHONE_NUMBER_ID o WHATSAPP_TOKEN no configurados');
        return { ok: false, error: 'Configuración incompleta' };
      }
      const normalizedTo = this.normalizePhoneNumber(to);
      const templateLang = (process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es_AR').replace(/\uFEFF/g, '');
      console.log(`📱 [WhatsApp] Sending template to ${normalizedTo} (${medicoNombre})`);

      const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedTo,
          type: 'template',
          template: {
            name: 'documento_disponible',
            language: { code: templateLang },
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: 'HeartLink' },
                { type: 'text', text: (medicoNombre || '').trim() },
                { type: 'text', text: (estudio || '').trim() },
                { type: 'text', text: (link || '').trim() },
              ],
            }],
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('✅ [WhatsApp] Template sent successfully:', data.messages?.[0]?.id);
        return { ok: true };
      }
      console.error('❌ [WhatsApp] Template send failed:', data);
      return { ok: false, error: data?.error?.message || 'Error al enviar' };
    } catch (err) {
      console.error('❌ [WhatsApp] Template send error:', err);
      return { ok: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }
  
  static async sendTextMessage(to: string, text: string): Promise<boolean> {
    try {
      const phoneId = sanitize(process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID);
      const token = sanitize(process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN);
      if (!phoneId || !token) {
        console.error('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID/PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN/WHATSAPP_TOKEN no configurados');
        return false;
      }
      const normalizedTo = this.normalizePhoneNumber(to);
      const cleanText = (text ?? '').replace(/\uFEFF/g, '');
      console.log(`📱 [WhatsApp] Sending text to ${normalizedTo}: ${cleanText.substring(0, 50)}...`);
      
      const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedTo,
          type: 'text',
          text: {
            body: cleanText
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ [WhatsApp] Message sent successfully:', result.messages?.[0]?.id);
        return true;
      } else {
        console.error('❌ [WhatsApp] Send failed:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Send error:', error);
      return false;
    }
  }

  static async sendListMessage(to: string, headerText: string, bodyText: string, listItems: Array<{id: string, title: string, description?: string}>): Promise<boolean> {
    try {
      const phoneId = sanitize(process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID);
      const token = sanitize(process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN);
      if (!phoneId || !token) {
        console.error('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID/PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN/WHATSAPP_TOKEN no configurados');
        return false;
      }
      const normalizedTo = this.normalizePhoneNumber(to);
      console.log(`📱 [WhatsApp] Sending list to ${normalizedTo}: ${listItems.length} items`);
      
      const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedTo,
          type: 'interactive',
          interactive: {
            type: 'list',
            header: {
              type: 'text',
              text: (headerText ?? '').replace(/\uFEFF/g, '')
            },
            body: {
              text: (bodyText ?? '').replace(/\uFEFF/g, '')
            },
            action: {
              button: 'Ver opciones',
              sections: [{
                title: 'Seleccionar',
                rows: listItems.map(item => ({
                  id: item.id,
                  title: (item.title || '').slice(0, 24),
                  description: (item.description || '').slice(0, 72)
                }))
              }]
            }
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ [WhatsApp] List sent successfully:', result.messages?.[0]?.id);
        return true;
      } else {
        console.error('❌ [WhatsApp] List send failed:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ [WhatsApp] List send error:', error);
      return false;
    }
  }

  static async downloadMedia(mediaId: string): Promise<Buffer | null> {
    try {
      const token = sanitize(process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN);
      if (!token) {
        console.error('[WhatsApp] WHATSAPP_ACCESS_TOKEN/WHATSAPP_TOKEN no configurado');
        return null;
      }
      console.log(`📱 [WhatsApp] Downloading media: ${mediaId}`);
      
      // First, get media URL
      const mediaResponse = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!mediaResponse.ok) {
        console.error('❌ [WhatsApp] Media URL fetch failed:', await mediaResponse.text());
        return null;
      }

      const mediaData = await mediaResponse.json();
      const mediaUrl = mediaData.url;

      // Download the actual media file
      const fileResponse = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!fileResponse.ok) {
        console.error('❌ [WhatsApp] Media download failed:', await fileResponse.text());
        return null;
      }

      const mediaBuffer = await fileResponse.arrayBuffer();
      console.log(`✅ [WhatsApp] Media downloaded: ${mediaBuffer.byteLength} bytes`);
      
      return Buffer.from(mediaBuffer);
    } catch (error) {
      console.error('❌ [WhatsApp] Media download error:', error);
      return null;
    }
  }
}