$root = Split-Path $PSScriptRoot -Parent
$implDir = Join-Path $root "private\sqlgenimpl"
$tags = @()
if (Test-Path (Join-Path $implDir "create_script.go")) { $tags += "sqlgen_create_script" }
if (Test-Path (Join-Path $implDir "migrate_script.go")) { $tags += "sqlgen_migrate_script" }
if (Test-Path (Join-Path $implDir "xlsx_import.go")) { $tags += "sqlgen_xlsx_import" }
if (Test-Path (Join-Path $implDir "xlsx_export.go")) { $tags += "sqlgen_xlsx_export" }

Push-Location $root
try {
    if ($tags.Count -gt 0) {
        wails build -tags ($tags -join ",")
    } else {
        wails build
    }
} finally {
    Pop-Location
}
