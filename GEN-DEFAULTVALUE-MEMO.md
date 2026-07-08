# gen.exe: defaultValue string 統一への対応メモ

db-gui 側で `defaultValue` を **string のみ** に変更した（2026-07）。gen.exe（別リポジトリ）側の対応方針をまとめる。

## 背景

- UI の「既定値」列は SQL リテラル断片のべた書き（例: `NULL`, `0`, `N'Hoge'`）
- 旧 schema では `string | number | boolean | null` の union 型だったが、UI との不整合でバグの温床だった
- db-gui は **string 統一** に変更済み

## db-gui から gen へ渡る JSON

gen.exe は db-gui 経由で **ディスク上の生 JSON** を受け取る（エディタの正規化は経由しない）。

```
ReadTableFile(path) → gen.exe create-script --input -
ReadTableFile(before/after) → gen.exe migrate-script
```

| 呼び出し元 | JSON の出所 |
|------------|-------------|
| ツリー「作成スクリプト生成」 | ディスク上の `*.table.json` |
| 差分「変更スクリプト生成」 | 比較対象の生 JSON |
| xlsx エクスポート | ディスク上の `*.table.json` |

**注意:** GUI で開いて保存し直していない旧形式ファイルは、gen に旧形式のまま渡る。

## 新 schema での defaultValue

[`schema/table.definition.schema.json`](schema/table.definition.schema.json):

```json
"defaultValue": {
  "description": "DEFAULT 句にそのまま埋め込む SQL リテラル断片（例: NULL, 0, N'Hoge'）",
  "type": "string"
}
```

| 意味 | JSON | DEFAULT 句の例 |
|------|------|----------------|
| デフォルトなし | フィールド省略 | （DEFAULT 句なし） |
| SQL NULL | `"NULL"` | `DEFAULT NULL` |
| 数値 | `"0"`, `"1"` | `DEFAULT 0` |
| 文字列 | `"N'Hoge'"` | `DEFAULT N'Hoge'` |
| 関数等 | `"GETDATE()"` | `DEFAULT GETDATE()` |

**原則:** `defaultValue` 文字列を **そのまま** `DEFAULT {defaultValue}` に埋め込む。追加のクォートや型変換は不要。

## gen.exe で必要な修正（想定）

### 1. 読み取り: string のみ受け付ける

- `defaultValue` は JSON string としてパース
- 旧形式（`null` / number / boolean）が来た場合は **読み込み互換** で string に正規化（下表参照）

### 2. SQL 生成: リテラルをそのまま使う

```sql
-- defaultValue: "NULL"   → DEFAULT NULL
-- defaultValue: "0"      → DEFAULT 0
-- defaultValue: "N'abc'" → DEFAULT N'abc'
```

**やってはいけない例:**

```sql
-- defaultValue: "NULL" を文字列リテラルとして扱う
DEFAULT 'NULL'   -- NG

-- defaultValue: "0" を number 型としてだけ扱い、string "0" を未対応にする
-- （string 統一後は "0" が来る）
```

### 3. migrate-script

- before/after で `defaultValue` の型が変わっても（旧 number → 新 string）、**正規化後の意味**で比較する
- 例: `0` (number) と `"0"` (string) は同じデフォルトとみなす

### 4. xlsx-import / xlsx-export

- xlsx-export: セル表示は `"NULL"`, `0`, `N'Hoge'` 等の SQL 断片
- xlsx-import: 出力 JSON の `defaultValue` は **string** で書く

## 読み込み互換（旧 JSON → string）

db-gui 側 [`normalizeDefaultValue`](frontend/src/utils/serializeTable.ts) と同じルールを gen でも推奨:

| 旧 JSON | 正規化後 |
|---------|----------|
| 未指定 / `""` | フィールド省略 |
| `null` | `"NULL"` |
| `0`, `1`, … (number) | `"0"`, `"1"`, … |
| `true` / `false` | `"true"` / `"false"` |
| `"NULL"` | `"NULL"`（そのまま） |
| `"N'Hoge'"` 等 | そのまま |

## 確認チェックリスト（gen 側）

- [ ] `create-script`: `"defaultValue": "NULL"` → `DEFAULT NULL`
- [ ] `create-script`: `"defaultValue": "0"` → `DEFAULT 0`
- [ ] `create-script`: `"defaultValue": "N'test'"` → `DEFAULT N'test'`
- [ ] `create-script`: 旧 `"defaultValue": 0` (number) でも `DEFAULT 0`
- [ ] `create-script`: 旧 `"defaultValue": null` でも `DEFAULT NULL`
- [ ] `migrate-script`: defaultValue 追加/変更/削除の検出
- [ ] `xlsx-import`: 出力 JSON が string 形式
- [ ] `xlsx-export`: string 形式の defaultValue を正しく表示

## db-gui 側の状態（参考）

| 項目 | 状態 |
|------|------|
| schema / TypeScript / Go 型 | string のみ |
| エディタ読み込み | 旧形式を string に正規化 |
| 保存 | string 形式で書き出し |
| gen 呼び出し | ディスク生 JSON をそのまま渡す（正規化なし） |

## 関連ファイル

- db-gui schema: [`schema/table.definition.schema.json`](schema/table.definition.schema.json)
- 正規化ロジック: [`frontend/src/utils/serializeTable.ts`](frontend/src/utils/serializeTable.ts)
- gen 呼び出し: [`internal/gencli/gencli.go`](internal/gencli/gencli.go)
- gen CLI 仕様: [`gen/CLI.md`](gen/CLI.md)
