# 📱 MESSENGER PLATFORM - SETUP GUIDE

## 🎯 Flujo: Mensaje Messenger → Respuesta automática

1. Usuario envía mensaje a tu página de Facebook
2. Meta envía webhook a tu servidor
3. HeartLink responde: "👋 Hola! Soy HeartLink. Recibimos tu mensaje correctamente."

---

## 🔧 Configuración en Meta

### 1. Crear o usar una Página de Facebook

- Ve a [facebook.com/pages](https://www.facebook.com/pages)
- Crea una página o usa una existente (ej: HeartLink)

### 2. Agregar producto Messenger

1. [developers.facebook.com](https://developers.facebook.com) → Tu app
2. **Agregar producto** → **Messenger** → **Configurar**
3. En **Configuración de Messenger**:
   - **Selecciona una página** → Vincula tu página de Facebook
   - Copia el **Page Access Token** (lo necesitas para `.env.local`)

### 3. Configurar Webhook

1. En **Webhooks** → **Configurar**
2. **Callback URL:** `https://tu-url-ngrok/api/messenger/webhook`  
   (o tu dominio en producción)
3. **Verify token:** `heartlink_webhook_2025` (o el valor de `MESSENGER_VERIFY_TOKEN`)
4. Haz clic en **Verificar y guardar**
5. **Suscribirse a campos:** marca **messages**, **messaging_postbacks** (opcional)
6. **Suscribir** tu página al webhook

---

## 📝 Variables de entorno (.env.local)

```env
# Messenger
MESSENGER_VERIFY_TOKEN=heartlink_webhook_2025
MESSENGER_PAGE_ACCESS_TOKEN=tu_page_access_token
```

**Obtener Page Access Token:**
- Meta Developer Console → Messenger → Configuración
- Junto a tu página: **Generar token** o **Ver token**

---

## 🧪 Probar con ngrok

1. Inicia Next.js: `npm run dev`
2. Inicia ngrok: `ngrok http 4000`
3. Usa la URL de ngrok en la Callback URL del webhook
4. Envía un mensaje a tu página de Facebook desde Messenger
5. Revisa los logs en la terminal

---

## 📁 Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `src/app/api/messenger/webhook/route.ts` | Endpoint GET/POST para webhook |
| `src/lib/messenger/parseWebhook.ts` | Parser del payload de Meta |
| `src/services/messenger-send.ts` | Envío de mensajes |
| `src/services/messenger-handler.ts` | Lógica de respuesta |

---

## 🔗 Endpoints

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/messenger/webhook` | GET | Verificación de Meta |
| `/api/messenger/webhook` | POST | Recepción de mensajes |

---

## ⚠️ Notas

- **Mismo verify token:** Puedes usar `WHATSAPP_VERIFY_TOKEN` si no defines `MESSENGER_VERIFY_TOKEN`
- **24h window:** Solo puedes enviar mensajes a usuarios que te hayan escrito en las últimas 24h (o con opt-in)
- **Página pública:** La página debe estar publicada para recibir mensajes
