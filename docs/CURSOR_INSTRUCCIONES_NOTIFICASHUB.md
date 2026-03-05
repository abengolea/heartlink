# Instrucciones para Cursor - Proyecto NotificasHub

Copiá este documento y usalo como contexto cuando trabajes en el proyecto **NotificasHub**. El objetivo es que NotificasHub reenvíe los mensajes de WhatsApp a HeartLink para que el robot responda.

---

## 1. Variables de entorno en NotificasHub

Agregar o actualizar en `.env` (o donde NotificasHub cargue sus variables):

```env
HEARTLINK_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app
INTERNAL_SECRET=heartlink_internal_2026
```

- `HEARTLINK_URL`: URL de producción de HeartLink.
- `INTERNAL_SECRET`: Mismo valor que en HeartLink. Se usa para autorizar las peticiones.

---

## 2. Reenviar mensajes a HeartLink

Ubicar el webhook de WhatsApp en NotificasHub (por ejemplo: `src/app/api/whatsapp/webhook/route.ts` o similar) y, en el handler POST que procesa los mensajes de Meta, agregar el reenvío a HeartLink.

Cuando hay un mensaje entrante del webhook de Meta:

```typescript
// Extraer el mensaje y el remitente del payload de Meta
const value = entry?.changes?.[0]?.value;
const message = value?.messages?.[0];
const from = message?.from ?? value?.contacts?.[0]?.wa_id;

if (message && from && process.env.HEARTLINK_URL && process.env.INTERNAL_SECRET) {
  try {
    const response = await fetch(`${process.env.HEARTLINK_URL}/api/whatsapp/incoming`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.INTERNAL_SECRET,
      },
      body: JSON.stringify({
        message,
        from: String(from),
        contactName: value?.contacts?.[0]?.profile?.name,
        messageId: message.id,
        timestamp: message.timestamp,
      }),
    });
    if (!response.ok) {
      console.error("[NotificasHub] HeartLink respondió:", response.status, await response.text());
    }
  } catch (err) {
    console.error("[NotificasHub] Error reenviando a HeartLink:", err);
  }
}
```

Notas:
- Responder 200 OK a Meta lo antes posible; el reenvío puede hacerse en paralelo (no bloquear la respuesta).
- `entry`, `changes`, `value` son la estructura típica del webhook de WhatsApp Cloud API de Meta.

---

## 3. Payload exacto que espera HeartLink

HeartLink acepta:

```json
{
  "message": { "type": "text", "text": { "body": "hola" }, "id": "wamid.xxx", "timestamp": "1234567890" },
  "from": "5493364645357",
  "contactName": "Juan",
  "messageId": "wamid.xxx",
  "timestamp": "1234567890"
}
```

- `message` y `from` son obligatorios.
- `contactName`, `messageId`, `timestamp` son opcionales (HeartLink usa valores por defecto si faltan).

**CRÍTICO – mensajes con media:** Reenviar el objeto `message` **completo y sin modificar** tal como lo envía Meta. Si se filtra o transforma el mensaje, se pierde el ID del media y HeartLink no puede descargar el video.

Para un video, Meta envía:
```json
{
  "id": "wamid.xxx",
  "from": "5493364645357",
  "timestamp": "1772659306",
  "type": "video",
  "video": {
    "id": "MEDIA_ID_AQUI",
    "mime_type": "video/mp4",
    "sha256": "..."
  }
}
```

HeartLink necesita `message.video.id` para descargar el video. Sin eso responde "No se pudo obtener el video".

Tipos que HeartLink necesita:
- `text` – `message.text.body`
- `video` – **`message.video.id`** (obligatorio para videos)
- `image` – `message.image.id`
- `interactive` – respuestas a listas (paciente, médico)
- `contacts` – **`message.contacts`** (array de contactos compartidos). Cada contacto tiene `name`, `phones` (o `vcard`). Meta envía `message.contacts` cuando el usuario comparte un contacto. Reenviar el objeto `message` completo sin filtrar – si se pierde `contacts`, HeartLink no puede extraer el teléfono del médico solicitante y no enviará la notificación.

---

## 4. Comportamiento esperado

1. Usuario envía "hola" por WhatsApp al número de WhatsApp Business.
2. Meta envía el webhook a NotificasHub.
3. NotificasHub reenvía a `POST {HEARTLINK_URL}/api/whatsapp/incoming` con el payload indicado.
4. HeartLink procesa y responde por WhatsApp al usuario.

---

## 5. Probar

1. Verificar que `HEARTLINK_URL` e `INTERNAL_SECRET` estén en `.env` de NotificasHub.
2. Reiniciar o redesplegar NotificasHub para que tome las variables.
3. Enviar "hola" por WhatsApp al número de negocio y ver si llega la respuesta del robot.

---

## 6. Depuración

Si no hay respuesta:

- Revisar logs de NotificasHub: ¿recibe el webhook de Meta? ¿envía el POST a HeartLink?
- Probar HeartLink directamente:

```powershell
Invoke-RestMethod -Uri "https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/incoming" -Method POST -Headers @{
  "Content-Type"="application/json"
  "x-internal-token"="heartlink_internal_2026"
} -Body '{"from":"5493364645357","message":{"type":"text","text":{"body":"hola"}}}'
```

Si esa llamada devuelve `{ ok: true }` y recibís el mensaje por WhatsApp, el fallo está en el reenvío desde NotificasHub.
