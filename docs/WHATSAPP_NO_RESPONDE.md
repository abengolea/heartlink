# Robot de WhatsApp no responde – Checklist

Si envías un mensaje (texto o video) y no recibís respuesta, revisá estos puntos en orden:

---

## 1. ¿Meta está enviando al webhook?

El webhook está en **NotificasHub** (no en HeartLink). Verificá:

- **Meta Developer Console** → WhatsApp → Configuración → Webhooks
- La URL debe ser la de **NotificasHub**, no HeartLink
- Suscripción a **messages** activada

**Número "Para" (modo desarrollo):**  
En WhatsApp API → Paso 1 “Seleccionar números de teléfono” → “Para”: agregá `+54 9 336 464 5357` (o tu número con código de país).

En modo desarrollo, Meta solo envía eventos de números que estén en "Para".

---

## 2. ¿NotificasHub reenvía a HeartLink?

NotificasHub debe reenviar cada mensaje a:

```
POST {HEARTLINK_URL}/api/whatsapp/incoming
Header: x-internal-token: {INTERNAL_SECRET}
```

Variables en NotificasHub:

- `HEARTLINK_URL` = `https://heartlink--heartlink-f4ftq.us-central1.hosted.app`
- `INTERNAL_SECRET` = mismo valor que en HeartLink

¿Ya agregaste el código de reenvío en el webhook de NotificasHub? Ver `CURSOR_WHATSAPP_NOTIFICASHUB.md`.

---

## 3. ¿Tu número está como operador en Firestore?

En **Firestore** (HeartLink), colección `users`, tu usuario debe tener:

- `phone`: número con código de país (ej: `543364645357` o `5493364645357`)
- `role`: `medico_operador`, `operator` o `admin`

**El sistema acepta ambos formatos para Argentina:** `543364645357` y `5493364645357` se consideran el mismo número.

---

## 4. Modo desarrollo (sin validar operador)

Para probar sin validar operador ni licencia, en producción (App Hosting) agregá el secret:

```
WHATSAPP_DEV_MODE=true
```

Y referenciarlo en `apphosting.yaml` para que el handler no exija operador ni licencia.

---

## 5. Formato del número

Meta envía el número en formato internacional (ej: `5493364645357`).  
El sistema hace matching flexible: acepta tanto `543364645357` como `5493364645357` para Argentina.

---

## Ver logs

- **HeartLink:** Firebase Console → App Hosting → heartlink → Logs  
  Buscá `[WhatsApp Handler]` o `[whatsapp/incoming]`
- **NotificasHub:** Revisá logs del webhook para ver si recibe y reenvía
