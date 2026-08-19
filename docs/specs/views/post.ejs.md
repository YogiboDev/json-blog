# views/post.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | カテゴリーバッジ（`/categories/:category`へのリンク）を追加 |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/post.ejs` |
| 役割 | 記事詳細画面（SCR-03）。記事本文の全文表示、削除操作、コメント一覧表示、コメント投稿フォームを提供する |
| 描画元ルート | `GET /posts/:id`, `POST /posts/:id/comments`（バリデーションエラー時の再描画）（いずれも`server.js`） |

## 2. 位置づけ・依存関係

- `partials/header.ejs`, `partials/footer.ejs`をインクルード
- `app.locals.formatDate()`を使用
- 削除フォームは`POST /posts/:id/delete`、コメント投稿フォームは`POST /posts/:id/comments`へ送信

## 3. 詳細仕様

### 3.1 受け取る変数

| 変数名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `post` | Post | ○ | 表示対象の記事 |
| `comments` | Comment[] | ○ | 当該記事のコメント一覧（投稿順） |
| `error` | string \| null | ○ | コメント投稿エラー時のメッセージ。正常表示時は`null` |

### 3.2 描画ロジック

1. ヘッダーへ`pageTitle: post.title`を渡してインクルード
2. `<article class="post-detail">`
   - タイトル、投稿日時（`formatDate(post.date)`）、投稿者
   - カテゴリーバッジ：`post.category || '未分類'`を`/categories/{encodeURIComponent(category)}`へのリンクとして表示（`category-badge`クラス）
   - タグ一覧（存在する場合のみ）
   - 本文全文：`<%= post.content %>`（CSS `white-space: pre-wrap`により改行を保持。HTMLエスケープ済み）
   - 削除フォーム：送信時にクライアント側`confirm('この記事を削除しますか？（コメントも全て削除されます）')`で確認。承認時のみ`POST /posts/:id/delete`を送信
3. `<section class="comments-section" id="comments">`
   - 見出し「コメント (件数)」
   - `error`が真の場合、`error-message`クラスでエラー文言を表示
   - `comments.length === 0`の場合：「まだコメントはありません。」を表示
   - それ以外：`comments`を`forEach`し、各コメントの投稿者名・日時・本文（`white-space: pre-wrap`で改行保持）を表示
   - コメント投稿フォーム：`name`（任意・`maxlength=50`）, `message`（必須・`textarea`）

## 4. 入出力仕様

- 入力: `post`, `comments`, `error`
- 出力: HTML全体
- フォーム送信先:
  - 削除：`POST /posts/:id/delete`
  - コメント投稿：`POST /posts/:id/comments`

## 5. 特記事項・留意点

- 削除確認ダイアログはブラウザ標準の`confirm()`によるクライアント側制御であり、サーバー側で二重に確認を求める仕組みはない。JavaScriptが無効な環境では確認なしに削除リクエストが送信される点に留意すること。
- コメント投稿フォームの送信先アンカーは`/posts/:id#comments`（`server.js`側のリダイレクト先）であり、投稿後はコメント欄へスクロールする。
- 本文・コメント本文とも`<%= %>`によるエスケープ出力でXSS対策済み。
