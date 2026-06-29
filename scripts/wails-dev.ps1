$root = Split-Path $PSScriptRoot -Parent

Push-Location $root
try {
    wails dev
} finally {
    Pop-Location
}
