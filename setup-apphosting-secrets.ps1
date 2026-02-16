# ===========================================
# Configura secrets de Firebase App Hosting desde .env.local
# Ejecutar: .\setup-apphosting-secrets.ps1
# ===========================================

$ErrorActionPreference = "Stop"
$ProjectId = "heartlink-f4ftq"
$Backend = "heartlink"
$EnvFile = ".env.local"

if (-not (Test-Path $EnvFile)) {
    Write-Host "ERROR: No existe $EnvFile" -ForegroundColor Red
    Write-Host "Copia .env.example a .env.local y completa los valores." -ForegroundColor Yellow
    exit 1
}

# Parse .env.local (soporta KEY=value y KEY="value")
function Get-EnvValue {
    param([string]$Key)
    $line = Get-Content $EnvFile | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (-not $line) { return $null }
    $parts = $line -split "=", 2
    $value = $parts[1].Trim()
    $value = $value.Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    return $value
}

# Mapeo: variable en .env.local -> nombre del secret en Firebase
$SecretMapping = @{
    "firebase-service-account-key" = "FIREBASE_SERVICE_ACCOUNT_KEY"
    "SERVICE_ACCOUNT_KEY"          = "FIREBASE_SERVICE_ACCOUNT_KEY"
    "GEMINI_API_KEY"               = "GEMINI_API_KEY"
    "GOOGLE_API_KEY"               = "GOOGLE_API_KEY"
    "WHATSAPP_ACCESS_TOKEN"        = "WHATSAPP_ACCESS_TOKEN"
    "WHATSAPP_PHONE_NUMBER_ID"     = "WHATSAPP_PHONE_NUMBER_ID"
    "MERCADOPAGO_ACCESS_TOKEN"     = "MERCADOPAGO_ACCESS_TOKEN"
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_APP_ID"  = "NEXT_PUBLIC_FIREBASE_APP_ID"
    "META_APP_SECRET"              = "META_APP_SECRET"
}

$SetCount = 0
$SkipCount = 0

foreach ($secretName in $SecretMapping.Keys) {
    $envKey = $SecretMapping[$secretName]
    $value = Get-EnvValue -Key $envKey

    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "[SKIP] $secretName (no hay valor en .env.local)" -ForegroundColor Gray
        $SkipCount++
        continue
    }

    $tmpFile = [System.IO.Path]::GetTempFileName()
    try {
        [System.IO.File]::WriteAllText($tmpFile, $value, [System.Text.Encoding]::UTF8)
        Write-Host "[SET]  $secretName..." -ForegroundColor Cyan
        firebase apphosting:secrets:set $secretName --data-file $tmpFile --project $ProjectId --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "       OK" -ForegroundColor Green
            $SetCount++
        } else {
            Write-Host "       ERROR" -ForegroundColor Red
        }
    } finally {
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Listo: $SetCount secrets configurados, $SkipCount omitidos (sin valor)" -ForegroundColor Green
Write-Host ""
Write-Host "Si hiciste cambios, el backend se redesplegará automáticamente." -ForegroundColor Yellow
