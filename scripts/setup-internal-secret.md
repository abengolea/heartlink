# Configurar INTERNAL_SECRET para deploy

El endpoint `/api/whatsapp/incoming` requiere `INTERNAL_SECRET`. Sin este secret, el deploy falla con "Secret mal configurado".

## Opción 1: Script automático (recomendado)

1. Agregá en `.env.local`:
   ```
   INTERNAL_SECRET=el_mismo_secreto_que_en_NotificasHub
   ```

2. Ejecutá:
   ```powershell
   .\scripts\setup-internal-secret.ps1
   ```
   El script lee el valor de `.env.local` y configura Firebase.

3. Si no tenés INTERNAL_SECRET en `.env.local`, el script te pedirá ingresarlo.

## Opción 2: Manual

```bash
# Crear el secret (te pedirá el valor)
firebase apphosting:secrets:set INTERNAL_SECRET --project heartlink-f4ftq

# Otorgar acceso al backend
firebase apphosting:secrets:grantaccess INTERNAL_SECRET --backend heartlink --project heartlink-f4ftq
```

## Después

Hacé push a `main` de nuevo para que el deploy se ejecute con el secret configurado.
