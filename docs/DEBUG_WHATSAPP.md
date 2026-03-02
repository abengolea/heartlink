# Debug: WhatsApp no responde

## 1. Ver logs en Firebase

Firebase Console → App Hosting → heartlink → **Logs**

Buscá:

| Log | Significado |
|-----|-------------|
| `[whatsapp/incoming] 401 Unauthorized` | INTERNAL_SECRET no coincide (NotificasHub ↔ HeartLink) |
| `[whatsapp/incoming] Request received` | La request llegó a HeartLink |
| `[whatsapp/incoming] Processed OK` | Handler terminó bien |
| `[WhatsApp] WHATSAPP_PHONE_NUMBER_ID... no configurados` | Faltan secrets en producción |
| `[WhatsApp] Send failed` | Meta rechazó el mensaje (revisar respuesta en el log) |

Si **no aparece ningún log** al enviar mensaje → el problema está antes de HeartLink (NotificasHub no reenvía o Meta no envía al webhook).

---

## 2. Probar conexión manualmente

Con tu INTERNAL_SECRET, probá que HeartLink reciba y responda:

```powershell
$url = "https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/incoming"
$secret = "TU_INTERNAL_SECRET"  # El de .env.local
$body = '{"from":"5493364645357","message":{"type":"text","text":{"body":"hola"}}}'

Invoke-RestMethod -Uri $url -Method POST -Headers @{
  "Content-Type" = "application/json"
  "x-internal-token" = $secret
} -Body $body
```

- **200 + ok: true** → HeartLink procesó. Deberías recibir WhatsApp. Si no llega, falla el envío a Meta (ver logs).
- **401** → INTERNAL_SECRET incorrecto.
- **Sin respuesta** → HeartLink caído o URL incorrecta.

---

## 3. Checklist NotificasHub

- ¿`HEARTLINK_URL` = `https://heartlink--heartlink-f4ftq.us-central1.hosted.app`?
- ¿`INTERNAL_SECRET` = mismo valor que en HeartLink?
- ¿El código de reenvío está en el webhook y desplegado?
- ¿NotificasHub recibe el webhook de Meta? (revisar logs de NotificasHub)

---

## 4. Variables en producción (HeartLink)

En Firebase App Hosting, el backend debe tener:

- `INTERNAL_SECRET`
- `PHONE_NUMBER_ID` o `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_TOKEN` o `WHATSAPP_ACCESS_TOKEN`
