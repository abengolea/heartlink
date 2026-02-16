/**
 * Suscribe el número de WhatsApp al webhook para recibir mensajes.
 * Ejecutar: node scripts/subscribe-whatsapp-webhook.js
 * Requiere: .env.local con WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').replace(/\uFEFF/g, '').trim();
  const phoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').replace(/\uFEFF/g, '').trim();

  if (!token || !phoneId) {
    console.error('Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID en .env.local');
    process.exit(1);
  }

  const url = `https://graph.facebook.com/v22.0/${phoneId}/subscribed_apps`;
  console.log('Suscribiendo', phoneId, 'a webhook messages...');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: ['messages'] }),
  });

  const data = await res.json();
  if (res.ok) {
    console.log('OK:', data);
  } else {
    console.error('Error:', data);
    process.exit(1);
  }
}

main();
