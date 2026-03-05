# Contacto compartido: "no se envía mensaje al médico solicitante"

## Síntoma

Cuando el operador comparte un contacto como médico solicitante en WhatsApp:
- El estudio se crea correctamente
- Pero el médico no recibe el mensaje con el link del estudio

## Posibles causas y soluciones

### 1. NotificasHub no reenvía `message.contacts`

**Causa:** Al reenviar a HeartLink, NotificasHub filtra o no incluye el objeto `message.contacts`.

**Solución:** Reenviar el objeto `message` **completo** tal como lo envía Meta, sin construir uno nuevo con solo algunos campos. Ver `docs/CURSOR_INSTRUCCIONES_NOTIFICASHUB.md`.

Para mensajes tipo contacts, Meta envía:
```json
{
  "type": "contacts",
  "contacts": [
    {
      "name": { "formatted_name": "Dr. X", "first_name": "X" },
      "phones": [ { "phone": "+54...", "wa_id": "549..." } ]
    }
  ]
}
```

### 2. Estructura alternativa de Meta

Algunas versiones o contextos envían el contacto en otros formatos:
- `message.contact` (singular)
- `contact.vcard` en lugar de `contact.phones`
- `contact.wa_id` o `contact.phone` a nivel raíz del contacto

**HeartLink (vía whatsapp-handler.ts)** ya soporta esas variantes desde la actualización de robustez.

### 3. Verificación en NotificasHub

Agregar log antes de reenviar:
```javascript
if (message.type === 'contacts') {
  console.log('[NotificasHub] contacts payload:', JSON.stringify(message.contacts || message.contact).slice(0, 300));
}
```

Si `message.contacts` es `undefined` o vacío, el problema está en la extracción del mensaje antes del reenvío.

### 4. Logs en HeartLink

En Firebase App Hosting, buscar:
- `[WhatsApp] Contacto extraído:` → si aparece, el teléfono se extrajo bien
- `[WhatsApp] Mensaje contacts sin datos:` → el payload llegó sin contacts
- `[WhatsApp] Contacto sin número válido:` → el contacto llegó pero sin phones/wa_id/vcard válido

## Referencia

- `docs/CURSOR_INSTRUCCIONES_NOTIFICASHUB.md` – sección "CRÍTICO – mensajes con media" aplica también a contacts
- `src/services/whatsapp-handler.ts` – `extractPhoneFromContact`, `handleContactsMessage`
