# SQL 生成・xlsx 変換（独自実装）

## 置き場所

```
private/sqlgenimpl/
  register.go           # リポジトリ同梱（触らなくてよい）
  create_script.go      # JSON 1件 → CREATE 等（独自実装・gitignore）
  migrate_script.go     # JSON 2件 → スキーマ変更 SQL（独自実装・gitignore）
  xlsx_import.go        # xlsx 1件 → *.table.json（独自実装・gitignore）
  xlsx_export.go        # *.table.json 1件 → xlsx（独自実装・gitignore）
  templates/            # xlsx 雛形（任意・gitignore）
    table.xlsx
```

初回は `sqlgenimpl.example/` から各 `*.go` をコピーして実装する。

## UI との対応

| 実装 | UI |
|---|---|
| `create_script.go` | ツリー右クリック「作成スクリプト生成」 |
| `migrate_script.go` | 差分モード「変更スクリプト生成」 |
| `xlsx_export.go` | ツリー右クリック「定義書エクスポート」 |
| `xlsx_import.go` | フォルダ右クリック「定義書インポート」 |

## 実装契約

interface は `internal/sqlgen/` を見る。

- `CreateScriptGenerator.Generate(tableJSON []byte) (sql, relPath, err)`
- `MigrateScriptGenerator.Generate(beforeJSON, afterJSON []byte) (sql, relPath, err)`
- `XlsxImportGenerator.Generate(xlsx []byte) (tableJSON, relPath, err)`
- `XlsxExportGenerator.Generate(tableJSON []byte) (xlsx, relPath, err)`

`relPath` は出力先ルートからの相対パス（例: `src/db/users.sql`）。

## xlsx 雛形

`private/sqlgenimpl/templates/` に xlsx を置き、`xlsx_import.go` / `xlsx_export.go` から `embed` で読み込める。

```go
//go:embed templates/*.xlsx
var templateFS embed.FS
```

## ビルド

各 `*.go` があると自動でビルドタグが付く:

```powershell
.\scripts\wails-dev.ps1
.\scripts\wails-build.ps1
```

手動なら `wails dev -tags sqlgen_create_script,sqlgen_migrate_script` など。

## AI への指示文（コピペ用）

```
private/sqlgenimpl/ に独自実装を追加する。
契約は internal/sqlgen/ の interface。sqlgenimpl.example/ を雛形にする。register.go は触らない。

create_script.go: *.table.json 1件から DDL を生成（//go:build sqlgen_create_script）
migrate_script.go: 変更前後の *.table.json 2件からスキーマ変更 SQL（//go:build sqlgen_migrate_script）
xlsx_import.go: xlsx 1件から *.table.json を生成（//go:build sqlgen_xlsx_import）
xlsx_export.go: *.table.json 1件から xlsx を生成（//go:build sqlgen_xlsx_export）

戻り値の relPath は出力ルートからの相対パス。
```
