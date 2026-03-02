# [ALTERNATIVA] Webhook de Meta apuntando directo a HeartLink

El plan original es: **Meta → NotificasHub → HeartLink**. Si preferís omitir NotificasHub, podés apuntar el webhook directo a HeartLink.

---

## Configuración en Meta Developer Console

1. Entrá a **Meta Developer Console** → tu app → **WhatsApp** → **Configuration**
2. Sección **Webhook**
3. **Edit** el webhook existente (o agregar uno nuevo)
4. Configurá:

| Campo | Valor |
|-------|-------|
| **Callback URL** | `https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/webhook` |
| **Verify token** | `heartlink_webhook_2025` |
| **Webhook fields** | Marcar **messages** |

5. **Verify and Save**

---

## Qué hace esto

- Meta envía los mensajes directo a HeartLink
- No usa NotificasHub
- No usa INTERNAL_SECRET
- El mismo `/api/whatsapp/webhook` que ya existe recibe y procesa

---

## Después de cambiar

1. Hacé deploy de HeartLink (para que WHATSAPP_VERIFY_TOKEN esté configurado)
2. En Meta: Verify and Save
3. Enviá "hola" por WhatsApp

---

## Si querés usar NotificasHub después

Podés volver a apuntar el webhook a NotificasHub y que reenvíe. Pero para probar rápido, usar HeartLink directo es lo más simple.
