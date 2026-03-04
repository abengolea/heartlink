# Error: "No se pudo obtener el video" en WhatsApp

## Síntoma

Cuando un operador envía un video por WhatsApp, HeartLink responde:
```
❌ No se pudo obtener el video.
```

En los logs aparece:
```
[WhatsApp Handler] Video sin id: {"id":"wamid.xxx","from":"549...","timestamp":"...","type":"video"}
[WhatsApp Handler] handleVideoMessage - video id: undefined
```

## Causa

El mensaje que llega a HeartLink tiene `type: "video"` pero **no incluye** el objeto `video` con el ID del media. Meta envía la estructura completa:

```json
{
  "id": "wamid.xxx",
  "from": "5493364645357",
  "timestamp": "1772659306",
  "type": "video",
  "video": {
    "id": "MEDIA_ID_PARA_DESCARGAR",
    "mime_type": "video/mp4",
    "sha256": "..."
  }
}
```

HeartLink necesita `message.video.id` para llamar a la WhatsApp Cloud API y descargar el archivo. Si ese objeto falta, no puede obtener el video.

## Dónde está el problema

Entre **Meta** y **HeartLink** está **NotificasHub**, que recibe el webhook y reenvía a HeartLink. Si NotificasHub filtra, transforma o construye el payload en lugar de reenviar el mensaje completo, se pierde `message.video`.

## Solución (en NotificasHub)

Al hacer el POST a `{HEARTLINK_URL}/api/whatsapp/incoming`, el body debe incluir el **objeto `message` exactamente como lo envía Meta**, sin eliminar campos.

**Correcto:**
```javascript
const value = entry?.changes?.[0]?.value;
const message = value?.messages?.[0];  // Objeto completo de Meta
// ...
body: JSON.stringify({
  message,  // <- Objeto completo, incluyendo message.video
  from: String(message.from),
  contactName: value?.contacts?.[0]?.profile?.name,
  messageId: message.id,
  timestamp: message.timestamp,
}),
```

**Incorrecto** (ejemplo de lo que podría estar pasando):
```javascript
// NO hacer esto: construir un objeto con solo algunos campos
body: JSON.stringify({
  message: {
    id: message.id,
    from: message.from,
    timestamp: message.timestamp,
    type: message.type,
    // Falta message.video ¡!
  },
  ...
}),
```

## Verificación

1. En NotificasHub, añadir un log del mensaje antes de reenviar:
   ```javascript
   console.log('[NotificasHub] Forwarding message keys:', Object.keys(message));
   if (message.type === 'video') {
     console.log('[NotificasHub] video object:', message.video);
   }
   ```
2. Si `message.video` es `undefined`, el problema está en cómo se extrae o construye el mensaje en NotificasHub.
3. Revisar el código del router / webhook: asegurarse de pasar el `message` raw de `value.messages[0]` sin modificarlo.

## Referencia

- `docs/CURSOR_INSTRUCCIONES_NOTIFICASHUB.md` – sección "Payload exacto" y "CRÍTICO – mensajes con media"
- `notificas-whatsapp-router/src/validate.ts` – schema actualizado con `video`, `image`, `contacts`
