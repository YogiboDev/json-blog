# views/login.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-20 | システム | #2: 新規作成（ログイン機能） |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/login.ejs` |
| 役割 | ログイン画面。ID・パスワードの入力フォームを提供し、ログイン失敗時はエラーメッセージを表示する |
| 描画元ルート | `GET /login`, `POST /login`（バリデーションエラー時の再描画）（いずれも`server.js`） |

## 2. 位置づけ・依存関係

- `partials/header.ejs`, `partials/footer.ejs`をインクルード
- フォーム送信先は`POST /login`

## 3. 詳細仕様

### 3.1 受け取る変数

| 変数名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `error` | string \| null | ○ | ログイン失敗時のエラーメッセージ。通常表示時は`null` |
| `redirect` | string | ○ | ログイン成功後の遷移先URL。`GET /login`の`redirect`クエリ、または`POST /login`失敗時に送信された値がそのまま渡される |

### 3.2 描画ロジック

1. ヘッダーへ`pageTitle: 'ログイン'`を渡してインクルード
2. `error`が真の場合、`error-message`クラスでエラー文言を表示
3. `<form class="post-form" action="/login" method="POST">`
   - `redirect`：`type="hidden"`。値は`redirect`変数（ログイン後にどこへ戻るかをフォーム送信まで保持するため）
   - `id`：`type="text"`, `required`, `maxlength="50"`, `autofocus`
   - `password`：`type="password"`, `required`, `maxlength="50"`
   - 送信ボタン「ログイン」

## 4. 入出力仕様

- 入力: `error`, `redirect`
- 出力: HTML全体
- フォーム送信先: `POST /login`（パラメータ: `id`, `password`, `redirect`）

## 5. 特記事項・留意点

- ログイン失敗時、入力済みの値（`id`）はテンプレート側で保持・再表示しない仕様（`new-post.ejs`と同様の方針）。利用者は再入力が必要。
- `redirect`はEJSの自動エスケープ出力（`<%= %>`）で描画しており、値自体は画面遷移先URLとしてのみ使用される（サーバー側でオープンリダイレクト対策の検証は行っていない。想定利用は自サイト内パスのみ）。
- パスワード入力欄は`type="password"`でブラウザ表示をマスクするが、通信経路の暗号化（HTTPS）はアプリケーション外の運用環境に依存する。
