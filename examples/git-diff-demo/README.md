# Git 履歴比較デモ

db-gui の「Git 履歴比較」機能を試すためのサンプルリポジトリです。

## 使い方

1. db-gui を起動する（`wails dev`）
2. 設定からこのディレクトリ（`examples/git-diff-demo`）を参照ディレクトリに追加
3. サイドバーの **Git 履歴比較**（枝分かれアイコン）をクリック
4. コミット一覧から左右（‹ ›）で2つのコミットを選ぶ

## コミット履歴

| コミット | 内容 |
|---------|------|
| 1 | `users` テーブルを追加 |
| 2 | `users` に balance 列を追加、`orders` テーブルを追加 |
| 3 | `products` テーブルを追加、`orders` に note 列を追加 |

## おすすめの比較

- **1 vs 3** — 追加・変更がまとめて見える
- **2 vs 3** — `products` 追加と `orders` の変更だけ

## 再生成

履歴を作り直す場合:

```powershell
cd examples/git-diff-demo
git checkout main 2>$null; if (-not $?) { git checkout master }
# またはリポジトリを削除して scripts/init-git-diff-demo.ps1 を実行
```

初回セットアップは `scripts/init-git-diff-demo.ps1` を参照してください。
