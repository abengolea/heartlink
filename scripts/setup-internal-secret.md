# Configurar INTERNAL_SECRET para deploy

El endpoint `/api/whatsapp/incoming` requiere `INTERNAL_SECRET`. Sin este secret, el deploy falla con "Secret mal configurado".

## Opción 1: Script con valor desde .env.local

Si tenés `INTERNAL_SECRET=tu_valor` en `.env.local`, ejecutá:
```powershell
.\scripts\setup-internal-secret.ps1
```

## Opción 1b: Script pasando el valor manualmente

Si el script no lo detecta, pasalo como parámetro:
```powershell
.\scripts\setup-internal-secret.ps1 -Secret "el_valor_que_tenes_en_env_local"
```

(Reemplazá por el valor real de tu `.env.local`)

## Opción 2: Manual

```bash
# Crear el secret (te pedirá el valor)
firebase apphosting:secrets:set INTERNAL_SECRET --project heartlink-f4ftq

# Otorgar acceso al backend
firebase apphosting:secrets:grantaccess INTERNAL_SECRET --backend heartlink --project heartlink-f4ftq
```

## Después

Hacé push a `main` de nuevo para que el deploy se ejecute con el secret configurado.
