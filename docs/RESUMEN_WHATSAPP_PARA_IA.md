# Resumen completo: WhatsApp HeartLink + NotificasHub (para otra IA)

## OBJETIVO

Que cuando un usuario envíe "hola" por WhatsApp al número de negocio, reciba una respuesta automática del robot. Flujo: **Meta → NotificasHub → HeartLink → respuesta por WhatsApp**.

---

## ARQUITECTURA

```
Usuario envía "hola" por WhatsApp
        ↓
Meta (WhatsApp Business API) envía webhook POST
        ↓
NOTIFICASHUB recibe (webhook URL de Meta debe apuntar aquí)
        ↓
NotificasHub reenvía POST a HeartLink /api/whatsapp/incoming
        ↓
HEARTLINK procesa, llama WhatsAppService.sendTextMessage()
        ↓
Meta API envía el mensaje de vuelta al usuario
```

- **Meta webhook** → debe apuntar a la URL de **NotificasHub** (NO a HeartLink).
- **HeartLink** tiene el robot que responde; necesita recibir el mensaje vía NotificasHub.

---

## QUÉ ESTÁ HECHO EN HEARTLINK

### Endpoint `/api/whatsapp/incoming`
- **Archivo:** `src/app/api/whatsapp/incoming/route.ts`
- **Método:** POST
- **Auth:** header `x-internal-token` debe ser igual a `INTERNAL_SECRET`
- **Valor actual:** `heartlink_internal_2026` (hardcodeado en apphosting.yaml)
- **Payload esperado:**
  ```json
  {
    "message": { "type": "text", "text": { "body": "hola" }, "id": "...", "timestamp": "..." },
    "from": "5493364645357",
    "contactName": "Juan",
    "messageId": "wamid.xxx",
    "timestamp": "1234567890"
  }
  ```
- **Obligatorios:** `message`, `from`
- **Opcionales:** `contactName`, `messageId`, `timestamp`

### Respuesta a "hola"
- **Handler:** `src/services/whatsapp-handler.ts` → `handleTextMessage`
- Para `"hola"`, `"hello"` o `"hi"` envía: `¡Hola {contactName}! 👋\n\nEnvía un video del estudio para comenzar.`

### Soporte para contactos (vCard)
- **Handler:** `src/services/whatsapp-handler.ts` → `handleContactsMessage`
- Cuando el operador está agregando un médico solicitante, puede **compartir el contacto** desde su libreta en lugar de escribir el número.
- Meta envía `message.type: "contacts"` y `message.contacts` con nombre y teléfono.
- NotificasHub debe reenviar el `message` completo (incluye `contacts`).

### Envío por WhatsApp
- **Servicio:** `src/services/whatsapp.ts` → `WhatsAppService.sendTextMessage()`
- **Variables:** `PHONE_NUMBER_ID` y `WHATSAPP_TOKEN` (o `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN`)
- **Estado:** Funciona. El test `POST /api/whatsapp/test` con `{"to":"5493364645357"}` devuelve success y envía WhatsApp.

### Test directo al incoming
```powershell
Invoke-RestMethod -Uri "https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/incoming" -Method POST -Headers @{"Content-Type"="application/json"; "x-internal-token"="heartlink_internal_2026"} -Body '{"from":"5493364645357","message":{"type":"text","text":{"body":"hola"}}}'
```
- **Resultado:** 200, `ok: true` → HeartLink procesa y responde por WhatsApp.
- **Conclusión:** HeartLink está bien. El problema está antes (Meta o NotificasHub).

### Test de mensaje contacts (contacto compartido)
```powershell
$body = @{
  from = "5493364645357"
  contactName = "Operador"
  message = @{
    type = "contacts"
    id = "wamid.test"
    timestamp = "1234567890"
    contacts = @(
      @{
        name = @{ formatted_name = "Dr. Juan Pérez"; first_name = "Juan" }
        phones = @( @{ phone = "5491112345678"; wa_id = "5491112345678" } )
      }
    )
  }
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/incoming" -Method POST -Headers @{"Content-Type"="application/json"; "x-internal-token"="heartlink_internal_2026"} -Body $body
```
- Solo tiene efecto si hay una sesión activa en `waiting_doctor_phone` (el operador envió video, eligió paciente y "Agregar médico por teléfono").

---

## QUÉ DEBE TENER NOTIFICASHUB

### Variables de entorno
```env
HEARTLINK_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app
INTERNAL_SECRET=heartlink_internal_2026
```

### Código de reenvío (en el handler POST del webhook de WhatsApp)
Cuando Meta envía un mensaje, el payload tiene esta estructura:
```javascript
body.entry[0].changes[0].value.messages[0]  // el mensaje
body.entry[0].changes[0].value.contacts[0]  // contacto (wa_id, profile.name)
```

Código a agregar:
```javascript
const value = body?.entry?.[0]?.changes?.[0]?.value;
const message = value?.messages?.[0];
const from = message?.from ?? value?.contacts?.[0]?.wa_id;

if (message && from && process.env.HEARTLINK_URL && process.env.INTERNAL_SECRET) {
  fetch(`${process.env.HEARTLINK_URL}/api/whatsapp/incoming`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": process.env.INTERNAL_SECRET,
    },
    body: JSON.stringify({
      message,
      from: String(from),
      contactName: value?.contacts?.[0]?.profile?.name,
      messageId: message?.id,
      timestamp: message?.timestamp,
    }),
  }).catch(err => console.error("[NotificasHub] Error reenvío HeartLink:", err));
}
```
- Importante: no bloquear la respuesta a Meta (200 OK en <5 segundos).

---

## PUNTOS DE FALLO (CHECKLIST)

| # | Qué verificar | Dónde |
|---|---------------|-------|
| 1 | Webhook de Meta apunta a NotificasHub | Meta Developer Console → WhatsApp → Webhooks → Callback URL |
| 2 | Campo **messages** suscrito en el webhook | Meta Developer Console |
| 3 | NotificasHub recibe el webhook | Logs de NotificasHub al enviar "hola" |
| 4 | NotificasHub tiene HEARTLINK_URL e INTERNAL_SECRET | .env / variables de despliegue |
| 5 | NotificasHub hace el POST con `x-internal-token: heartlink_internal_2026` | Código del webhook |
| 6 | HeartLink recibe la request | Logs Firebase: `[whatsapp/incoming] Request received` |
| 7 | HeartLink responde 200 | Si hay 401 → INTERNAL_SECRET no coincide |

---

## CONFIGURACIÓN ACTUAL

- **HeartLink URL:** `https://heartlink--heartlink-f4ftq.us-central1.hosted.app`
- **INTERNAL_SECRET:** `heartlink_internal_2026` (en apphosting.yaml de HeartLink)
- **Endpoint HeartLink:** `POST /api/whatsapp/incoming`
- **Proyecto Firebase HeartLink:** `heartlink-f4ftq`
- **Proyecto NotificasHub:** `studio-3864746689-59018`

---

## TESTS QUE SÍ FUNCIONAN

1. `POST /api/whatsapp/test` con `{"to":"5493364645357"}` → success, envía WhatsApp.
2. `POST /api/whatsapp/incoming` con header correcto y body válido → 200, `ok: true`, envía respuesta por WhatsApp.

---

## LO QUE NO FUNCIONA

Cuando el usuario envía "hola" por WhatsApp al número real:
- No recibe respuesta.
- El bloqueo está en: Meta no envía a NotificasHub, o NotificasHub no recibe, o NotificasHub no reenvía a HeartLink, o NotificasHub reenvía mal (token/body).

---

## LOGS A REVISAR

- **NotificasHub:** ver si aparece algo al enviar "hola" (Cloud Logging o equivalente).
- **HeartLink:** Firebase Console → App Hosting → heartlink → Logs. Buscar `[whatsapp/incoming]`. Si no hay nada, la request nunca llega a HeartLink.

---

## DOCUMENTOS RELACIONADOS EN HEARTLINK

- `docs/CURSOR_INSTRUCCIONES_NOTIFICASHUB.md` – instrucciones para NotificasHub
- `docs/PROMPT_CURSOR_NOTIFICASHUB.md` – prompt para Cursor en NotificasHub
- `docs/DEBUG_WHATSAPP.md` – pasos de depuración
- `docs/CURSOR_WHATSAPP_NOTIFICASHUB.md` – contexto técnico general

---

## REPOSITORIO

- **HeartLink:** https://github.com/abengolea/heartlink  
- Rama: main  
- Último commit relevante: fix INTERNAL_SECRET, endpoint incoming, payload completo
