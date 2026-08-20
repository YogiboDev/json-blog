# views/new-post.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | #1: カテゴリー入力欄（既存カテゴリーの`<datalist>`補完付き）を追加 |
| 1.2 | 2026-08-20 | システム | #2: 描画元ルート（`GET /new`, `POST /posts`）にログイン必須化（`auth.requireLogin`）が適用されたことに伴う特記事項を追加。テンプレート自体の変更はなし |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/new-post.ejs` |
| 役割 | 新規投稿画面（SCR-02）。記事投稿フォームを提供する |
| 描画元ルート | `GET /new`, `POST /posts`（バリデーションエラー時の再描画）（いずれも`server.js`） |

## 2. 位置づけ・依存関係

- `partials/header.ejs`, `partials/footer.ejs`をインクルード
- フォーム送信先は`POST /posts`

## 3. 詳細仕様

### 3.1 受け取る変数

| 変数名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `error` | string \| null | ○ | 投稿失敗時のエラーメッセージ。通常表示時は`null` |
| `categories` | `{name, count}[]` | ○ | 既存カテゴリー一覧（`db.getCategories()`）。カテゴリー入力欄の`<datalist>`候補として使用 |

### 3.2 描画ロジック

1. ヘッダーへ`pageTitle: '新規投稿'`を渡してインクルード
2. `error`が真の場合、`error-message`クラスでエラー文言を表示
3. `<form class="post-form" action="/posts" method="POST">`
   - `title`：`type="text"`, `required`, `maxlength="200"`
   - `content`：`<textarea>`, `required`, 10行
   - `author`：`type="text"`, 任意, `maxlength="50"`, placeholder「匿名」
   - `category`：`type="text"`, 任意, `maxlength="50"`, placeholder「未分類」。`list="category-suggestions"`で`categories`を`<datalist>`の候補として表示（自由入力も可）
   - `tags`：`type="text"`, 任意, placeholder「例: 日記, 技術」（カンマ区切り入力を想定）
   - 送信ボタン「投稿する」

## 4. 入出力仕様

- 入力: `error`, `categories`
- 出力: HTML全体
- フォーム送信先: `POST /posts`（パラメータ: `title`, `content`, `author`, `tags`, `category`）

## 5. 特記事項・留意点

- `required`属性によるクライアント側必須チェックに加え、サーバー側（`server.js`）でも`title`/`content`の空白のみ入力を弾くバリデーションを行っている（二重チェック）。
- 投稿失敗時、入力済みの値はテンプレート側で保持・再表示しない仕様（`error`のみを受け取り、フォーム自体は空の状態で再描画される）。利用者は再入力が必要。
- 描画元の両ルート（`GET /new`, `POST /posts`）には`auth.requireLogin`ミドルウェアが適用されており、未ログイン状態では本テンプレートは描画されず`/login`へリダイレクトされる。テンプレート自身にはログイン状態を判定する分岐はない。
