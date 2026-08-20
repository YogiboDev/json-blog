# views/new-post.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | #1: カテゴリー入力欄（既存カテゴリーの`<datalist>`補完付き）を追加 |
| 1.2 | 2026-08-20 | システム | #2: 描画元ルート（`GET /new`, `POST /posts`）にログイン必須化（`auth.requireLogin`）が適用されたことに伴う特記事項を追加。テンプレート自体の変更はなし |
| 1.3 | 2026-08-20 | システム | #3: 本文入力欄にTinyMCEリッチテキストエディタを導入（セルフホストスクリプト読み込み・初期化設定を追加、`textarea`の`required`属性を削除） |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/new-post.ejs` |
| 役割 | 新規投稿画面（SCR-02）。記事投稿フォーム（TinyMCEリッチテキストエディタ付き）を提供する |
| 描画元ルート | `GET /new`, `POST /posts`（バリデーションエラー時の再描画）（いずれも`server.js`） |

## 2. 位置づけ・依存関係

- `partials/header.ejs`, `partials/footer.ejs`をインクルード
- 静的配信ルート`/tinymce/tinymce.min.js`（および内部で読み込まれる`/tinymce/langs/ja.js`等）に依存
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
   - `content`：`<textarea name="content" rows="10">`（TinyMCE初期化対象）
   - `author`：`type="text"`, 任意, `maxlength="50"`, placeholder「匿名」
   - `category`：`type="text"`, 任意, `maxlength="50"`, placeholder「未分類」。`list="category-suggestions"`で`categories`を`<datalist>`の候補として表示（自由入力も可）
   - `tags`：`type="text"`, 任意, placeholder「例: 日記, 技術」（カンマ区切り入力を想定）
   - 送信ボタン「投稿する」
4. `<script src="/tinymce/tinymce.min.js" referrerpolicy="origin"></script>`
5. `tinymce.init` スクリプト：
   - `license_key: 'gpl'`
   - `selector: 'textarea[name="content"]'`
   - `height: 400`
   - `menubar: false`
   - `language: 'ja'`（日本語UI）
   - `plugins: 'lists link autolink'`
   - `toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | blockquote link | removeformat'`

## 4. 入出力仕様

- 入力: `error`, `categories`
- 出力: HTML全体
- フォーム送信先: `POST /posts`（パラメータ: `title`, `content`（HTML文字列）, `author`, `tags`, `category`）

## 5. 特記事項・留意点

- 本文（`textarea`）はTinyMCEによってリッチテキストエディタに置き換えられるため、ブラウザ標準の`required`属性は付与していない（サーバー側の`server.js`で必須チェック・空文字バリデーションを実施）。
- 投稿失敗時、入力済みの値はテンプレート側で保持・再表示しない仕様（`error`のみを受け取り、フォーム自体は空の状態で再描画される）。利用者は再入力が必要。
- 描画元の両ルート（`GET /new`, `POST /posts`）には`auth.requireLogin`ミドルウェアが適用されており、未ログイン状態では本テンプレートは描画されず`/login`へリダイレクトされる。テンプレート自身にはログイン状態を判定する分岐はない。
- TinyMCEのスクリプト・言語ファイルはCDNではなく自サーバー（`/tinymce`）から静的配信されるため、外部ネットワーク接続やAPIキーは不要。
