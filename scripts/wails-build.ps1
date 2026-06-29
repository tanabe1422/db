$root = Split-Path $PSScriptRoot -Parent

Push-Location $root
try {
    wails build
} finally {
    Pop-Location
}
