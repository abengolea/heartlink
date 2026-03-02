# Instrucciones para Cursor - Proyecto NotificasHub

**Copiá y pegá este prompt completo en Cursor cuando abras el proyecto NotificasHub:**

---

```
Implementá el reenvío de mensajes de WhatsApp desde NotificasHub a HeartLink.

## FLUJO
Meta (webhook) → NotificasHub → HeartLink → [HeartLink responde por WhatsApp al usuario]

Cuando un usuario envía "hola" al número de WhatsApp Business, NotificasHub recibe el webhook de Meta. Debés reenviar ese mensaje a HeartLink para que el robot responda.

## 1. VARIABLES DE ENTORNO
Agregar en .env.local / .env (y en el deployment: Vercel, Firebase, etc.):
```
HEARTLINK_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app
INTERNAL_SECRET=heartlink_internal_2026
```

## 2. UBICAR EL WEBHOOK
Buscá el archivo que maneja el POST del webhook de WhatsApp de Meta (ej: app/api/whatsapp/webhook/route.ts, o similar). Ese handler recibe el payload cuando Meta envía un mensaje.

## 3. ESTRUCTURA DEL PAYLOAD DE META
Meta envía algo como:
```
{ "object": "whatsapp_business_account", "entry": [{ "id": "...", "changes": [{ "value": { "messaging_product": "whatsapp", "metadata": {...}, "contacts": [{ "profile": { "name": "Juan" }, "wa_id": "5493364645357" }], "messages": [{ "from": "5493364645357", "id": "wamid.xxx", "timestamp": "1234567890", "type": "text", "text": { "body": "hola" } }] }, "field": "messages" }] }] }
```

Cuando el usuario COMPARTE UN CONTACTO (vCard), el mensaje tiene type "contacts":
```
"messages": [{ "from": "54933...", "id": "wamid.xxx", "timestamp": "...", "type": "contacts", "contacts": [{ "name": { "formatted_name": "Dr. Juan" }, "phones": [{ "phone": "5491112345678", "wa_id": "5491112345678" }] }] }]
```
Debés reenviar el objeto message completo (incluido contacts) a HeartLink.

## 4. CÓDIGO DE REENVÍO
Dentro del handler POST, cuando procesás el body:
- Extraer: const entry = body?.entry?.[0]; const value = entry?.changes?.[0]?.value; const message = value?.messages?.[0];
- Si message existe: const from = message.from ?? value?.contacts?.[0]?.wa_id;
- Si message y from existen, y HEARTLINK_URL e INTERNAL_SECRET están definidos, hacer:
  fetch(`${process.env.HEARTLINK_URL}/api/whatsapp/incoming`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": process.env.INTERNAL_SECRET!,
    },
    body: JSON.stringify({
      message,
      from: String(from),
      contactName: value?.contacts?.[0]?.profile?.name,
      messageId: message.id,
      timestamp: message.timestamp,
    }),
  })
- Importante: NO bloquees la respuesta a Meta. Respondé 200 OK rápido. El fetch a HeartLink puede ser fire-and-forget (void o .catch) o con await pero después de enviar tu respuesta. Meta exige respuesta en <5 segundos.

## 5. LOGS
Agregar console.log cuando:
- Recibís un mensaje de Meta (message?.type, from)
- Reenviás a HeartLink
- HeartLink responde con status !== 200 (loguear status y body)
- Hay error en el fetch

## 6. VALIDACIONES
- Si !process.env.HEARTLINK_URL o !process.env.INTERNAL_SECRET: console.warn y no hacer fetch (pero igual responder 200 a Meta).

## 7. DESPLIEGUE
Verificá que HEARTLINK_URL e INTERNAL_SECRET estén configuradas en el entorno de producción de NotificasHub (Vercel env vars, Firebase config, etc.). Sin eso no funciona.
```

---
