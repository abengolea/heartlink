# WhatsApp Router Multi-tenant – Diseño de flujo

## Flujo general

```
Meta Webhook POST
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Validar payload (Zod)                                     │
│ 2. Idempotencia: si message.id ya en wa_messages → 200 OK    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Por cada mensaje:                                            │
│   resolveTenant(phone, message)                              │
│   ├─ silent_unregistered  → log only, NO response            │
│   ├─ silent_or_handoff    → log only, NO response            │
│   ├─ ask_choice           → sendInteractiveList, pending     │
│   └─ route               → delegar al handler del tenant     │
└─────────────────────────────────────────────────────────────┘
```

## Algoritmo resolveTenant

1. **getMemberships(phone)** → si vacío → `silent_unregistered`
2. **Inferir tenant** (en orden):
   - referral source / text prefijado (RIVER, NAUTICA, etc.)
   - wa_sessions activa (activeTenantId)
   - wa_last_tenant ≤ 30 días
3. **Si membership.length === 1** → `route`
4. **Si membership.length > 1 y no inferido**:
   - Si hay pending_choice y usuario responde 1/2/3 → `route`
   - Si responde otra cosa → reintentar hasta 2 veces → `silent_or_handoff`
   - Si no hay pending → `ask_choice`
5. **Si membership.length > 1 e inferido** → `route`

## Modelo Firestore

| Colección | Documento | Campos |
|-----------|-----------|--------|
| tenants | tenantId | name, status |
| user_memberships | phone_sanitized | tenantIds[], updatedAt |
| wa_sessions | sessionKey | phone, conversationId, activeTenantId, state, createdAt, updatedAt, expiresAt |
| wa_messages | messageId | direction, phone, tenantId?, payload, createdAt |
| wa_pending_choices | phone_sanitized | options[], createdAt, expiresAt, attempts |
| wa_last_tenant | phone_sanitized | tenantId, updatedAt |

## Session key

- `sessionKey = ${phone}_${conversationId}` si conversationId existe
- Si no: `sessionKey = ${phone}_${dateBucket}` (bucket 24h por timestamp)

## Referral / Text prefijado

Tokens conocidos en text.body o referral:
- `RIVER` → Escuela River
- `NAUTICA` → Náutica
- Configurables por tenant en tenants/{id}.referralTokens
