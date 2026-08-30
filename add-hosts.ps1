# Añade jardin.local al archivo hosts de Windows (requiere admin)
# Se ejecuta con UAC. Uso: powershell -ExecutionPolicy Bypass -File add-hosts.ps1
$hosts = "$env:windir\System32\drivers\etc\hosts"
$line = "127.0.0.1 jardin.local"

$content = Get-Content $hosts -Raw
if ($content -match $line) {
    Write-Host "jardin.local ya estaba en el hosts. Nada que hacer."
} else {
    Add-Content -Path $hosts -Value "`r`n# El Jardin de los Recuerdos`r`n$line"
    Write-Host "AGREGADO: $line a $hosts"
}
Write-Host "Hecho. Pulsa una tecla para cerrar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
