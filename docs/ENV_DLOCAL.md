# Variables de entorno para dLocal Go

Variables necesarias en `.env.local` para integrar **dLocal Go** como pasarela de pago.

---

## Variables requeridas

```env
# dLocal Go
# Testing: https://api-sbx.dlocalgo.com | Live: https://api.dlocalgo.com
DLOCAL_API_KEY=<tu_api_key>
DLOCAL_SECRET_KEY=<tu_secret_key>
DLOCAL_BASE_URL=https://api.dlocalgo.com
DLOCAL_WEBHOOK_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/dlocal/webhook
DLOCAL_RETURN_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app/dashboard/subscription
# true = Sandbox (pruebas), false = Producción
DLOCAL_SANDBOX=true
```

---

## Dónde obtenerlas

1. Entrá a **[dashboard-sbx.dlocalgo.com](https://dashboard-sbx.dlocalgo.com)** (sandbox) o **[dashboard.dlocalgo.com](https://dashboard.dlocalgo.com)** (live)
2. Ir a **Integraciones** (o Integrations)
3. Copiar **API Key** y **Secret Key** de la sección "Claves de integración"

---

## URLs de la API

| Entorno | Base URL |
|--------|----------|
| Sandbox | `https://api-sbx.dlocalgo.com` |
| Live | `https://api.dlocalgo.com` |

Si definís `DLOCAL_BASE_URL`, se usa esa URL en lugar de derivarla de `DLOCAL_SANDBOX`.

---

## Autenticación

Cada request usa header:

```
Authorization: Bearer <API_KEY>:<SECRET_KEY>
```

---

## Tarjetas de prueba (sandbox)

- **Aprobada:** 4111 1111 1111 1111  
- **Rechazada:** 5555 5555 5555 4444  
- Vencimiento: cualquier fecha futura  
- CVV: cualquiera
