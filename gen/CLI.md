# gen CLI インターフェース

db-gui は `gen/gen.exe` を外部プロセスとして起動し、SQL 生成・xlsx 変換を委譲する。
実装は別リポジトリで行い、ビルド成果物をここに配置する。

## 配置

```
gen/
  CLI.md      # 本仕様（リポジトリ同梱）
  gen.exe     # CLI 本体（別プロジェクトでビルド・ローカル配置、gitignore）
```

exe は 1 つのみ。同一役割の複数バージョン併置や GUI での切り替えは想定しない。

db-gui 側の解決順:

1. 環境変数 `DB_GUI_GEN`（フルパス）があればそれを使う（開発・デバッグ用）
2. なければカレントディレクトリ基準の `gen/gen.exe`
3. なければ実行ファイルと同じディレクトリの `gen.exe`（配布ビルド用）

## 共通規約

- 引数なし、または `--help` / `-h` で usage を stderr に出し exit 0
- 成功時 exit 0、失敗時 exit 1（エラー内容は **stderr** に人間可読テキスト）
- 成功時の結果は **stdout** に JSON 1 行（UTF-8、末尾改行あり）
- ファイル入力のパスに `-` を指定した場合は **stdin** から読む
- バイナリ（xlsx）は JSON 内で **base64**（標準エンコーディング、パディングあり）

### 出力 JSON の共通フィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `relPath` | string | 出力先ルートからの相対パス（`/` 区切り）。空文字は呼び出し側のデフォルト命名に任せる |

## サブコマンド

### `create-script`

`*.table.json` 1 件から CREATE 等の DDL を生成する。

**UI 対応:** ツリー右クリック「作成スクリプト生成」

```
gen.exe create-script --input <PATH>
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `--input` | yes | `*.table.json` のパス（`-` で stdin） |

**stdout 例:**

```json
{"relPath":"src/db/users.sql","sql":"CREATE TABLE users (...);"}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `sql` | string | 生成 SQL 全文 |

---

### `migrate-script`

変更前後の `*.table.json` 2 件からスキーマ変更 SQL を生成する。

**UI 対応:** 差分モード「変更スクリプト生成」

```
gen.exe migrate-script --before <PATH> --after <PATH>
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `--before` | yes | 変更前 `*.table.json`（`-` で stdin） |
| `--after` | yes | 変更後 `*.table.json`（`-` で stdin） |

**stdout 例:**

```json
{"relPath":"src/db/users.migrate.sql","sql":"ALTER TABLE users ADD ...;"}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `sql` | string | 生成 SQL 全文 |

---

### `xlsx-export`

`*.table.json` 1 件から定義書 xlsx を生成する。

**UI 対応:** ツリー右クリック「定義書エクスポート」

```
gen.exe xlsx-export --input <PATH>
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `--input` | yes | `*.table.json` のパス（`-` で stdin） |

**stdout 例:**

```json
{"relPath":"src/db/users.xlsx","data":"UEsDBBQAAAAI..."}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `data` | string | xlsx バイナリの base64 |

---

### `xlsx-import`

xlsx 1 件から `*.table.json` を生成する。

**UI 対応:** フォルダ右クリック「定義書インポート」

```
gen.exe xlsx-import --input <PATH>
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `--input` | yes | xlsx のパス（`-` で stdin） |

**stdout 例:**

```json
{"relPath":"src/db/users.table.json","tableJSON":"{\"name\":\"users\",...}"}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `tableJSON` | string | `*.table.json` の内容（UTF-8 テキスト。JSON オブジェクトのシリアライズ文字列） |

## db-gui からの呼び出しイメージ

メモリ上の JSON を渡す場合、db-gui は一時ファイルに書き出すか stdin 経由（`--input -`）で渡す。

```
# create-script（stdin）
echo '{...}' | gen.exe create-script --input -

# migrate-script（一時ファイル 2 件）
gen.exe migrate-script --before C:\Temp\before.table.json --after C:\Temp\after.table.json
```

## 別プロジェクト実装者向けチェックリスト

- [ ] 4 サブコマンドすべて実装
- [ ] 成功時 stdout は JSON 1 行のみ（ログは stderr へ）
- [ ] `relPath` は `/` 区切り
- [ ] ビルド後 `gen/gen.exe` にコピーして db-gui から動作確認
