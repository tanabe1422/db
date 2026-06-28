# Initializes examples/git-diff-demo with three commits for Git diff testing.
$ErrorActionPreference = 'Stop'

$demoDir = Join-Path (Join-Path $PSScriptRoot '..') 'git-diff-demo'
Set-Location $demoDir

if (Test-Path '.git') {
    Remove-Item -Recurse -Force '.git'
}

# Commit 1: users only (initial)
@'
{
  "$schema": "../../schema/table.definition.schema.json",
  "schemaVersion": 1,
  "name": "users",
  "nameJa": "ユーザー",
  "description": "アプリ利用者マスタ",
  "primaryKey": ["id"],
  "columns": [
    { "name": "id", "dataType": "bigint", "nameJa": "ID", "notNull": true },
    { "name": "email", "dataType": "nvarchar", "nameJa": "メールアドレス", "notNull": true, "unique": true, "length": 255 },
    { "name": "createdAt", "dataType": "datetime2", "nameJa": "作成日時", "notNull": true }
  ]
}
'@ | Set-Content -Encoding UTF8 'users.table.json'
Remove-Item -ErrorAction SilentlyContinue 'orders.table.json', 'products.table.json'

git init -b main
git add users.table.json README.md
git -c user.email='demo@db-gui.local' -c user.name='db-gui demo' commit -m 'add users table'

# Commit 2: users + orders
@'
{
  "$schema": "../../schema/table.definition.schema.json",
  "schemaVersion": 1,
  "name": "users",
  "nameJa": "ユーザー",
  "description": "アプリ利用者マスタ",
  "primaryKey": ["id"],
  "columns": [
    { "name": "id", "dataType": "bigint", "nameJa": "ID", "notNull": true },
    { "name": "email", "dataType": "nvarchar", "nameJa": "メールアドレス", "notNull": true, "unique": true, "length": 255 },
    { "name": "balance", "dataType": "decimal", "nameJa": "残高", "notNull": true, "precision": 18, "scale": 2, "defaultValue": 0 },
    { "name": "createdAt", "dataType": "datetime2", "nameJa": "作成日時", "notNull": true }
  ]
}
'@ | Set-Content -Encoding UTF8 'users.table.json'
@'
{
  "$schema": "../../schema/table.definition.schema.json",
  "schemaVersion": 1,
  "name": "orders",
  "nameJa": "注文",
  "primaryKey": ["id"],
  "columns": [
    { "name": "id", "dataType": "bigint", "nameJa": "ID", "notNull": true },
    { "name": "userId", "dataType": "bigint", "nameJa": "ユーザーID", "notNull": true },
    { "name": "total", "dataType": "decimal", "nameJa": "合計", "notNull": true, "precision": 18, "scale": 2 }
  ]
}
'@ | Set-Content -Encoding UTF8 'orders.table.json'
git add users.table.json orders.table.json
git -c user.email='demo@db-gui.local' -c user.name='db-gui demo' commit -m 'add orders and update users'

# Commit 3: products + orders note
@'
{
  "$schema": "../../schema/table.definition.schema.json",
  "schemaVersion": 1,
  "name": "orders",
  "nameJa": "注文",
  "primaryKey": ["id"],
  "columns": [
    { "name": "id", "dataType": "bigint", "nameJa": "ID", "notNull": true },
    { "name": "userId", "dataType": "bigint", "nameJa": "ユーザーID", "notNull": true },
    { "name": "total", "dataType": "decimal", "nameJa": "合計", "notNull": true, "precision": 18, "scale": 2 },
    { "name": "note", "dataType": "nvarchar", "nameJa": "備考", "length": 500 }
  ]
}
'@ | Set-Content -Encoding UTF8 'orders.table.json'
@'
{
  "$schema": "../../schema/table.definition.schema.json",
  "schemaVersion": 1,
  "name": "products",
  "nameJa": "商品",
  "primaryKey": ["id"],
  "columns": [
    { "name": "id", "dataType": "bigint", "nameJa": "ID", "notNull": true },
    { "name": "name", "dataType": "nvarchar", "nameJa": "商品名", "notNull": true, "length": 200 },
    { "name": "price", "dataType": "decimal", "nameJa": "価格", "notNull": true, "precision": 18, "scale": 2 }
  ]
}
'@ | Set-Content -Encoding UTF8 'products.table.json'
git add orders.table.json products.table.json
git -c user.email='demo@db-gui.local' -c user.name='db-gui demo' commit -m 'add products table'

Write-Host 'Done. Commits:'
git log --oneline
