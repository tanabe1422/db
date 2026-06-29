# プロジェクト概要

SQL Server テーブル定義を `*.table.json` で管理するプロジェクトです。

## *.table.json

- 正本は `*.table.json`。SQL は `gen.exe` の出力であり、手編集の正本にしない。
- スキーマ定義: `schema/table.definition.schema.json`
- 例: `examples/users.table.json`（なければ既存の `*.table.json` を参照）
- `schemaVersion` は `1`。必須: `name`, `columns`
- カラムのキーは英語 `name`。PK は `primaryKey` で指定
- `identity` カラムはテーブルに高々 1 つ。`decimal` / `numeric` は `precision` >= `scale`

## 編集時の注意

- 新規・変更は JSON を直接編集する
- SQL が必要なときは `gen.exe create-script` / `migrate-script` を使う（`gen/CLI.md` 参照）
