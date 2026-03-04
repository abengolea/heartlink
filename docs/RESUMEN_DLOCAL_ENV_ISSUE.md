# Resumen: DLOCAL_API_KEY no se carga en Next.js

## Problema

La API `POST /api/dlocal/create-payment` devuelve 500:

```
Error: dLocal Go credentials missing: DLOCAL_API_KEY, DLOCAL_SECRET_KEY
```

## Diagnóstico

El endpoint `GET /api/debug-env` mostró:
- `hasDLocalApiKey: false` — DLOCAL_API_KEY **no** está en `process.env`
- `hasDLocalSecretKey: true` — DLOCAL_SECRET_KEY **sí** está cargada
- `availableEnvKeys` incluye `DLOCAL_SECRET_KEY` y `DLOCAL_SANDBOX` pero **no** `DLOCAL_API_KEY`

## Lo que el usuario tiene en .env.local

```env
DLOCAL_API_KEY=WclAEZsecYnDPUXoopd************
DLOCAL_SECRET_KEY=mNbeb6y***
DLOCAL_BASE_URL=https://api.dlocalgo.com
DLOCAL_WEBHOOK_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/dlocal/webhook
DLOCAL_RETURN_URL=https://heartlink--heartlink-f4ftq.us-central1.hosted.app/dashboard/subscription
DLOCAL_SANDBOX=true
```

El usuario confirma que `DLOCAL_API_KEY` está definida en `.env.local`.

## Contexto técnico

- **Framework**: Next.js 15
- **Archivo**: `.env.local` en la raíz del proyecto
- **Código que falla**: `src/lib/dlocal.ts` — `process.env.DLOCAL_API_KEY` devuelve `undefined`
- **Otro dato**: `DLOCAL_SECRET_KEY` sí se carga correctamente (mismo archivo, misma estructura)

## Hipótesis

1. **Nombre o typos**: ¿Existe otra variable con nombre parecido que pueda pisar o confundir?
2. **Orden/posición en el archivo**: ¿La posición de la línea afecta la carga?
3. **Codificación del archivo**: ¿BOM, UTF-16 u otro encoding que rompa el parsing?
4. **Otro archivo .env**: ¿`.env`, `.env.development` o `.env.production` definen `DLOCAL_API_KEY` vacía y tienen prioridad?
5. **Caché de Next.js**: ¿El directorio `.next` mantiene alguna caché de env?

## Archivos relevantes

| Archivo | Función |
|---------|---------|
| `src/lib/dlocal.ts` | Lee `DLOCAL_API_KEY` y `DLOCAL_SECRET_KEY` |
| `src/app/api/dlocal/create-payment/route.ts` | Ruta que crea el pago |
| `src/app/api/debug-env/route.ts` | Debug de variables de entorno |
| `.env.local` | Definición de variables (raíz del proyecto) |

## Lo que ya se probó

- Reiniciar el servidor (`npm run dev`)
- Verificar que la variable esté en `.env.local`
- Usar fallback a `DLOCAL_GO_API_KEY` en el código (por si el nombre era distinto)

## Pregunta para resolver

¿Por qué `process.env.DLOCAL_API_KEY` es `undefined` si `DLOCAL_API_KEY` está en `.env.local` y `DLOCAL_SECRET_KEY` (en el mismo archivo) sí se carga?
