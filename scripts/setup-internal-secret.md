# Configurar INTERNAL_SECRET para deploy

El endpoint `/api/whatsapp/incoming` requiere `INTERNAL_SECRET`. Ejecutá:

```bash
firebase apphosting:secrets:set INTERNAL_SECRET --project heartlink-f4ftq
```

Cuando te pida el valor, pegá el mismo secreto que tenés en NotificasHub (mismo que en tu `.env.local` de HeartLink).

Luego:

```bash
firebase apphosting:secrets:grantaccess INTERNAL_SECRET --backend heartlink --project heartlink-f4ftq
```

---

**PowerShell (valor desde variable):**
```powershell
$secret = "tu_secreto_aqui"  # El mismo que en NotificasHub
$secret | firebase apphosting:secrets:set INTERNAL_SECRET --project heartlink-f4ftq --data-file=-
```
