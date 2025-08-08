const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export class WhatsAppService {
  
  static async sendTextMessage(to: string, text: string): Promise<boolean> {
    try {
      console.log(`📱 [WhatsApp] Sending text to ${to}: ${text.substring(0, 50)}...`);
      
      const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: text
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
      console.log(`📱 [WhatsApp] Sending list to ${to}: ${listItems.length} items`);
      
      const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'list',
            header: {
              type: 'text',
              text: headerText
            },
            body: {
              text: bodyText
            },
            action: {
              button: 'Seleccionar',
              sections: [{
                title: 'Opciones',
                rows: listItems.map(item => ({
                  id: item.id,
                  title: item.title,
                  description: item.description || ''
                }))
              }]
            }
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ [WhatsApp] List message sent successfully:', result.messages?.[0]?.id);
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
      console.log(`📱 [WhatsApp] Downloading media: ${mediaId}`);
      
      // First, get media URL
      const mediaResponse = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
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
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
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