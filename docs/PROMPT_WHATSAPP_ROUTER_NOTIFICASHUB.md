# Prompt completo: WhatsApp Router multi-tenant para NotificasHub

Copiá todo lo que está debajo del separador y usalo como prompt en Cursor cuando trabajes en el proyecto **NotificasHub**.

---

## PROMPT PARA CURSOR (NotificasHub)

Actuá como arquitecto senior full-stack (Node.js/TypeScript) especializado en Firebase + WhatsApp Cloud API (Meta). Implementá un **WhatsApp Router multi-tenant** en NotificasHub.

### OBJETIVO

NotificasHub recibe el webhook de WhatsApp Cloud API. Un mismo número puede pertenecer a varios tenants (ej: "HeartLink", "Náutica", "Escuela River"). El sistema debe:

1. **Determinar a qué tenant corresponde el mensaje** (resolver contexto).
2. **Si el número NO está registrado en ningún tenant:** NO responder nada (silencio total). Igual registrar evento en auditoría.
3. **Si está registrado en 1 tenant:** asignar automáticamente y enrutar al handler de ese tenant.
4. **Si está registrado en 2+ tenants:** preguntar "¿Por cuál servicio consultás?" y enviar lista con opciones 1/2/3. Esperar respuesta numérica. Persistir elección para la ventana actual (24h) y opcionalmente recordar "último tenant" por 30 días.
5. **Minimizar preguntas:** si el mensaje trae referral o texto precargado (ej. usuario entró desde https://wa.me/NUM?text=RIVER), inferir el tenant sin preguntar.
6. **Guardar auditoría completa:** inbound/outbound, timestamps, conversation id, pricing category si existe.

### STACK Y RESTRICCIONES

- TypeScript estricto (sin `any`). Código libre de errores TS.
- Firebase: Firestore + Cloud Functions (o Cloud Run) + Secret Manager para tokens.
- Next.js puede existir; el webhook debe estar en server (Cloud Functions o API route server-side).
- No usar librerías raras; preferir `fetch` nativo, **zod** para validar payloads.
- Incluir tests unitarios (vitest o jest) para `resolveTenant` y parsers.
- **Idempotencia:** Meta reintenta webhooks. Usar `message.id` como clave única en `wa_messages` para evitar duplicados.

### MODELO DE DATOS (Firestore)

| Colección | Documento | Campos principales |
|-----------|-----------|---------------------|
| tenants | tenantId | name, status, referralTokens?: string[], webhookUrl?: string, internalSecret?: string |
| user_memberships | phone_sanitized | phone, tenantIds[], updatedAt |
| wa_sessions | sessionKey | phone, conversationId?, activeTenantId, state, createdAt, updatedAt, expiresAt |
| wa_messages | messageId (de Meta) | direction: "in"\|"out", phone, tenantId?, payload, createdAt, pricingCategory? |
| wa_pending_choices | phone_sanitized | options: {index, tenantId, label}[], createdAt, expiresAt, attempts |
| wa_last_tenant | phone_sanitized | tenantId, updatedAt |

**sessionKey:**
- Si `conversationId` existe: `${phone}_${conversationId}`
- Si no: `${phone}_${dateBucket}` con bucket de 24h (YYYYMMDD por timestamp UTC)

**phone_sanitized:** reemplazar caracteres no alfanuméricos por `_` para usar como doc ID.

### ALGORITMO resolveTenant(phone, message)

1. `getMemberships(phone)` → si vacío o sin tenantIds → `{ action: "silent_unregistered" }`
2. **Inferir tenant** (en orden de prioridad):
   - referral / text prefijado: tokens en `tenants.referralTokens` (ej. RIVER, NAUTICA, HEARTLINK)
   - si hay `wa_sessions` activa en ventana → usar `activeTenantId`
   - si hay `wa_last_tenant` ≤ 30 días y tenant sigue en membership → usarlo
3. Si `membership.tenantIds.length === 1` → `{ action: "route", tenantId }`
4. Si `length > 1` y no inferido:
   - Si hay `wa_pending_choices` y usuario responde 1/2/3 → resolver opción, setear session y last_tenant → `{ action: "route", tenantId }`
   - Si responde otra cosa → incrementar `attempts`. Si attempts ≥ 2 → `{ action: "silent_or_handoff" }` y borrar pending
   - Si no hay pending → `{ action: "ask_choice", options: [...] }`
5. Si `length > 1` e inferido → `{ action: "route", tenantId }`

### ENTRADAS WHATSAPP (webhook Meta)

- `messages[].from` (número), `messages[].id`, `timestamp`, `type`, `text.body`
- Soporte para **interactive replies** (botones/listas): `interactive.list_reply.id` o `button_reply.id` pueden ser "1", "2", "3"
- Soporte para **referral** si viene en el mensaje
- Si no hay referral, leer `text.body` para tokens prefijados (wa.me?text=RIVER)

### RESPUESTAS WHATSAPP (Graph API)

- `sendText(phone, text)` → mensaje de sesión (dentro de 24h)
- `sendInteractiveList(phone, header, body, options)` → lista con opciones
- Preferir lista interactiva si 3+ opciones; botones si 2; texto si 1
- **IMPORTANTE:** solo responder si `action !== "silent_unregistered"` y `action !== "silent_or_handoff"`

### ENRUTADO A TENANTS

Cada tenant en `tenants/{id}` puede tener:
- `webhookUrl`: URL a la que reenviar (ej. `https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/incoming`)
- `internalSecret`: header `x-internal-token` para autorizar

Cuando `action === "route"`:
1. Cargar tenant de Firestore
2. Hacer POST a `webhookUrl` con payload: `{ message, from, contactName, messageId, timestamp }`
3. El tenant (HeartLink, etc.) procesa y responde por WhatsApp usando sus propias credenciales, O NotificasHub envía en su nombre si el tenant delega el envío.

**HeartLink como tenant:** ya tiene su endpoint `/api/whatsapp/incoming` que espera ese payload y responde por WhatsApp. NotificasHub debe reenviar ahí cuando `tenantId === "heartlink"`.

### ESTRUCTURA DE CARPETAS RECOMENDADA

```
src/
  whatsapp/
    types.ts
    validate.ts          # zod schemas, extractIncomingMessages, parseNumericChoice, parseReferralToken
    firestore.ts         # getMemberships, getTenants, getSession, setSession, getPendingChoice, setPendingChoice, etc.
    resolve-tenant.ts    # resolveTenantForIncomingMessage(phone, message)
    sender.ts            # sendText, sendInteractiveList (Graph API)
    webhook-handler.ts   # handler principal del webhook
```

### CÓDIGO DE REFERENCIA

En el repo HeartLink existe una carpeta `notificas-whatsapp-router/` con código base:
- `src/types.ts` – interfaces
- `src/validate.ts` – schemas Zod, extractIncomingMessages, parseNumericChoice, parseReferralToken
- `src/firestore.ts` – persistencia (adaptar a la estructura de NotificasHub)
- `ARCHITECTURE.md` – flujo y algoritmo

Podés usar eso como base y adaptarlo a NotificasHub (rutas, init de Firebase, etc.).

### VARIABLES DE ENTORNO

```
# WhatsApp Cloud API (Meta)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=

# Firebase (si usás Firestore)
GOOGLE_APPLICATION_CREDENTIALS=  # o Firebase Admin ya inicializado

# Tenants (opcional, si se configuran por env en vez de Firestore)
HEARTLINK_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app
INTERNAL_SECRET=heartlink_internal_2026
```

### EJEMPLOS wa.me CON TEXT PREFIJADO

- `https://wa.me/5491112345678?text=RIVER` → usuario entra con "RIVER" en el mensaje → inferir Escuela River
- `https://wa.me/5491112345678?text=NAUTICA` → inferir Náutica
- Configurar `referralTokens` en cada tenant en Firestore para mapear token → tenantId

### CONSIDERACIONES DE CUMPLIMIENTO

1. **No responder a no registrados:** cumplimiento con políticas de WhatsApp (no spam).
2. **Límite de intentos:** máx 2 reintentos en ask_choice antes de `silent_or_handoff`.
3. **Idempotencia:** siempre checkear `wa_messages` por `message.id` antes de procesar; si existe, return 200 y no reprocesar.
4. **Responder 200 OK a Meta en < 5 segundos:** procesar en background si hace falta; no bloquear la respuesta al webhook.

### ENTREGABLES

1. Código TypeScript completo en `src/whatsapp/`
2. Handler del webhook integrado en la app (Cloud Function o API route)
3. Tests unitarios para `resolveTenant` y `parseNumericChoice` / `parseReferralToken`
4. README con: variables de entorno, cómo desplegar, ejemplos wa.me, consideraciones de cumplimiento

### PRIORIDADES

1. Robustez e idempotencia
2. UX: no preguntar si se puede inferir el tenant
3. TypeScript estricto y código limpio
