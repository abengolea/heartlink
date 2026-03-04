# Debug: DLocal env vars no se cargan en Next.js

## Problema

Al llamar a `POST /api/dlocal/create-payment`, la API responde 500 con:

```
Error: dLocal Go credentials missing: DLOCAL_API_KEY, DLOCAL_SECRET_KEY
```

Aunque `.env.local` está configurado con esos valores.

---

## Lo que implementamos

1. **Integración dLocal Go** para pagos de suscripción ($20.000 ARS)
2. **API route** `/api/dlocal/create-payment` que:
   - Lee `process.env.DLOCAL_API_KEY` y `process.env.DLOCAL_SECRET_KEY`
   - Si faltan, lanza el error anterior
   - Llama a la API de dLocal Go para crear el pago
3. **Variables esperadas** en `.env.local`:

```env
DLOCAL_API_KEY=WclAEZsecYnDP***
DLOCAL_SECRET_KEY=mNbeb6y***
DLOCAL_BASE_URL=https://api.dlocalgo.com
DLOCAL_WEBHOOK_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/dlocal/webhook
DLOCAL_RETURN_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app/dashboard/subscription
DLOCAL_SANDBOX=true
```

4. **Código que falla** (`src/lib/dlocal.ts` líneas 46-55):

```typescript
const apiKey = process.env.DLOCAL_API_KEY;
const secretKey = process.env.DLOCAL_SECRET_KEY;

if (!apiKey || !secretKey) {
  throw new Error(
    'dLocal Go credentials missing: DLOCAL_API_KEY, DLOCAL_SECRET_KEY'
  );
}
```

---

## Posibles causas

### 1. Next.js no cargó `.env.local` (más frecuente)

Las variables se leen **solo al iniciar** el servidor. Si se editaron después de arrancar `npm run dev`:

- Detener el servidor (Ctrl+C)
- Volver a ejecutar `npm run dev`

### 2. Archivo incorrecto o mal ubicado

- Debe ser `.env.local` (con punto al inicio)
- En la **raíz** del proyecto (mismo nivel que `package.json`)
- No usar `.env` (Next.js prioriza `.env.local`)

### 3. Formato del archivo

- Una variable por línea
- Sin espacios alrededor del `=`: `DLOCAL_API_KEY=valor`
- Sin comillas en el valor salvo que sea necesario
- Sin caracteres extra (BOM, saltos de línea raros)

### 4. Variables vacías

Si el valor está vacío o solo espacios, `!apiKey` será `true` y fallará. Verificar que no haya líneas como:

```env
DLOCAL_API_KEY=
```

### 5. Caché de Next.js

Probar limpiar caché y reiniciar:

```bash
rm -rf .next
npm run dev
```

En Windows PowerShell:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

## Cómo verificar

Hay una ruta de debug en `GET /api/debug-env` que indica si las variables existen (sin mostrar valores):

```json
{
  "hasDLocalApiKey": true,
  "hasDLocalSecretKey": true,
  ...
}
```

Si ambas son `false`, las variables no están llegando al servidor.

---

## Orden de prioridad de env en Next.js

1. `process.env` (variables del sistema)
2. `.env.$(NODE_ENV).local` (ej. `.env.development.local`)
3. `.env.local` (no se usa en `test`)
4. `.env.$(NODE_ENV)` (ej. `.env.development`)
5. `.env`

Comprobar que no haya otro `.env` sobrescribiendo con valores vacíos.

---

## Archivos relevantes

| Archivo | Propósito |
|---------|-----------|
| `src/lib/dlocal.ts` | Lee `DLOCAL_API_KEY`, `DLOCAL_SECRET_KEY` |
| `src/app/api/dlocal/create-payment/route.ts` | Usa `createDLocalGoPayment()` |
| `src/app/api/debug-env/route.ts` | Debug de variables cargadas |
| `.env.local` | Definición de variables (raíz del proyecto) |
