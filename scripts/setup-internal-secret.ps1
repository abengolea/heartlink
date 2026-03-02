# Configurar INTERNAL_SECRET para Firebase App Hosting
# Uso: .\scripts\setup-internal-secret.ps1
# O: .\scripts\setup-internal-secret.ps1 -Secret "tu_secreto_aqui"

param(
    [string]$Secret = ""
)

if (-not $Secret) {
    # Intentar leer de .env.local
    $envFile = Join-Path $PSScriptRoot "..\\.env.local"
    if (Test-Path $envFile) {
        $line = Get-Content $envFile | Where-Object { $_ -match "^\s*INTERNAL_SECRET=(.+)$" }
        if ($line) {
            $Secret = ($line -replace "^\s*INTERNAL_SECRET=", "").Trim().Trim('"').Trim("'")
        }
    }
}

if (-not $Secret) {
    Write-Host "INTERNAL_SECRET no encontrado en .env.local" -ForegroundColor Yellow
    $Secret = Read-Host "Ingresá el mismo valor que en NotificasHub (no se mostrará al escribir)"
}

if (-not $Secret) {
    Write-Host "Error: Se requiere el valor de INTERNAL_SECRET" -ForegroundColor Red
    exit 1
}

Write-Host "Creando secret INTERNAL_SECRET..." -ForegroundColor Cyan
$Secret | firebase apphosting:secrets:set INTERNAL_SECRET --project heartlink-f4ftq --data-file=-

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al crear el secret" -ForegroundColor Red
    exit 1
}

Write-Host "Otorgando acceso al backend heartlink..." -ForegroundColor Cyan
firebase apphosting:secrets:grantaccess INTERNAL_SECRET --backend heartlink --project heartlink-f4ftq

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al otorgar acceso" -ForegroundColor Red
    exit 1
}

Write-Host "`nListo. El próximo deploy usará INTERNAL_SECRET." -ForegroundColor Green
Write-Host "Si el deploy ya falló, hace push a main de nuevo o crea un rollout manual." -ForegroundColor Gray
