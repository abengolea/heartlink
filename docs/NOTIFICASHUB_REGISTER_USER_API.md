# API register-user – NotificasHub

HeartLink llama a este endpoint cuando crea o actualiza un usuario con teléfono, para que el router multi-tenant de NotificasHub pueda enrutar mensajes de WhatsApp a HeartLink.

## Endpoint

```
POST {NOTIFICASHUB_URL}/api/register-user
```

## Headers

| Header             | Valor                          |
|--------------------|--------------------------------|
| Content-Type       | application/json               |
| x-internal-token   | INTERNAL_SECRET (mismo que usa HeartLink) |

## Body

```json
{
  "phone": "5493364645357",
  "tenantId": "heartlink"
}
```

- `phone`: número normalizado (solo dígitos, con código de país 54 para Argentina)
- `tenantId`: siempre `"heartlink"` (por ahora)

## Comportamiento esperado

NotificasHub debe crear o actualizar el documento en la colección `user_memberships`:

- **Documento ID:** `phone_sanitized` (reemplazar caracteres no alfanuméricos por `_`)
- **Campos:**
  - `phone`: el número tal cual llega
  - `tenantIds`: array que incluya `"heartlink"` (merge, no reemplazar, por si el usuario tiene otros tenants)
  - `updatedAt`: timestamp

Ejemplo para `phone: "5493364645357"`:
```json
{
  "phone": "5493364645357",
  "tenantIds": ["heartlink"],
  "updatedAt": "2026-03-04T..."
}
```

Si el usuario ya existe en `user_memberships` con otros tenants, agregar `"heartlink"` al array sin borrar los demás.

## Respuestas

- **200 OK** – Registro exitoso
- **401** – Token inválido
- **400** – Body inválido (falta phone, etc.)

## Variables en HeartLink

Para que HeartLink pueda llamar:

```env
NOTIFICASHUB_URL=https://notificashub--studio-3864746689-59018.us-east4.hosted.app
INTERNAL_SECRET=heartlink_internal_2026
```
