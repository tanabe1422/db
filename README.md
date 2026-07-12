# db-gui

Go (Wails) + React + TypeScript + Storybook のデスクトップ GUI プロジェクトです。

## 構成

```
db-gui/
├── main.go              # Wails エントリポイント
├── internal/app/        # Go バックエンドロジック
├── frontend/            # React + TypeScript (pnpm)
│   ├── src/
│   └── .storybook/
├── wails.json
└── go.mod
```

## 前提条件

- [Go](https://go.dev/dl/) 1.23+
- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) (`corepack enable` で有効化可能)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

```powershell
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Windows では WebView2 ランタイムも必要です（通常は既にインストール済み）。

## セットアップ

```powershell
# フロントエンド依存関係
cd frontend
pnpm install

# Go 依存関係（プロジェクトルートで）
cd ..
go mod tidy
```

## 開発

### フロントのみ（ブラウザ）

```powershell
cd frontend
pnpm dev
```

### Storybook

```powershell
cd frontend
pnpm storybook
```

### GUI アプリ（Wails ホットリロード）

```powershell
wails dev
```

## ドキュメント

- [docs/BACKLOG.md](docs/BACKLOG.md) — 残課題・優先順位
- [docs/refactoring/](docs/refactoring/) — 構造リファクタの経緯
- Storybook — UI コンポーネントのカタログ（上記 `pnpm storybook`）

## ビルド

```powershell
wails build
```

ビルド成果物は `build/bin/` に出力されます。

## Go ↔ React の連携

Go 側の `internal/app/app.go` に定義したメソッドは、Wails が自動で TypeScript バインディングを生成します（`wails dev` / `wails build` 実行時）。

フロント側は `frontend/src/lib/wails.ts` 経由で呼び出します。ブラウザ単体開発時はフォールバックメッセージが表示されます。
