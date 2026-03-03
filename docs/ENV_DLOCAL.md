# Variables de entorno para dLocal Go

Variables necesarias en `.env.local` para integrar **dLocal Go** como pasarela de pago.

---

## Variables requeridas

```env
# API Key (clave pública)
DLOCAL_GO_API_KEY=<tu_api_key>

# Secret Key (clave privada - ¡no compartir!)
DLOCAL_GO_SECRET_KEY=<tu_secret_key>

# true = Sandbox (pruebas)
# false o vacío = Producción
DLOCAL_GO_SANDBOX=true
```

---

## Dónde obtenerlas

1. Entrá a **[dashboard-sbx.dlocalgo.com](https://dashboard-sbx.dlocalgo.com)** (sandbox) o **[dashboard.dlocalgo.com](https://dashboard.dlocalgo.com)** (live)
2. Ir a **Integraciones** (o Integrations)
3. Copiar **API Key** y **Secret Key** de la sección "Claves de integración"

> **SmartFields API Key** se usa para formularios de tarjeta en el frontend; HeartLink usa flujo REDIRECT, así que no es necesaria para nuestra integración.

---

## URLs de la API

| Entorno | Base URL |
|--------|----------|
| Sandbox | `https://api-sbx.dlocalgo.com` |
| Live | `https://api.dlocalgo.com` |

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
