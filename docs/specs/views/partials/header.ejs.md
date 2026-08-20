# views/partials/header.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | #1: ナビゲーションに「カテゴリー」（`/categories`）へのリンクを追加 |
| 1.2 | 2026-08-20 | システム | ナビゲーションに「タグ」（`/tags`）へのリンクを追加 |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/partials/header.ejs` |
| 役割 | 全画面共通のHTML冒頭部（`<head>`〜`<body>`開始〜ヘッダー〜`<main>`開始タグまで）を提供する共通パーツ |
| インクルード元 | `index.ejs`, `post.ejs`, `new-post.ejs`, `calendar.ejs`, `404.ejs`（各テンプレート先頭で`<%- include('partials/header', {...}) %>`により読み込み） |

## 2. 位置づけ・依存関係

- `public/css/style.css`を`<link>`で読み込む
- ヘッダー内ナビゲーションは`/`, `/categories`, `/tags`, `/calendar`, `/new`への静的リンク
- 検索フォームは`GET /search`へ送信（`server.js`のルート#4に対応）

## 3. 詳細仕様

### 3.1 受け取る変数（呼び出し元テンプレートから渡される`include`の第2引数）

| 変数名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `pageTitle` | string | 任意 | `<title>`タグに`"{pageTitle} - JSON Blog"`として反映。未指定時は`"JSON Blog"`のみ |
| `searchQuery` | string | 任意 | 検索ボックスの初期値。未指定時は空文字 |

### 3.2 描画内容

1. `<!DOCTYPE html>` 〜 `<head>`：文字コード（UTF-8）、viewport、`<title>`、CSSリンク
2. `<header class="site-header">`
   - ロゴ（`📝 JSON Blog`、`/`へのリンク）
   - `<nav class="main-nav">`：ホーム／カテゴリー／タグ／カレンダー／新規投稿の5リンク
   - `<form class="search-form" action="/search" method="GET">`：`<input name="q">`（`value`に`searchQuery`を反映）、送信ボタン
3. `<main class="container">`（開始タグのみ。閉じタグは`footer.ejs`側）

## 4. 入出力仕様

- 入力: `pageTitle`, `searchQuery`（`include`呼び出し時のローカル変数）
- 出力: HTML文字列（部分）。単独では完結したHTMLにならず、必ず対応する`footer.ejs`とセットで使用する前提

## 5. 特記事項・留意点

- `<main>`の開始タグをこのファイルで開き、終了タグを`footer.ejs`で閉じる構成のため、両ファイルは常にペアで使用すること。片方のみを変更する場合はタグの対応関係を崩さないよう注意する。
- `searchQuery`はEJSの自動エスケープ出力（`<%= %>`）を使用しており、XSS対策済み。
