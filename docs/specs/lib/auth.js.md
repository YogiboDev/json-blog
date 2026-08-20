# lib/auth.js 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-20 | システム | #2: 新規作成（ログイン機能） |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `lib/auth.js` |
| 役割 | 固定ID・パスワードによる認証判定、ログイン状態を表すCookieの発行・検証、ログイン必須ルート用のExpressミドルウェアを提供する認証層 |
| 呼び出し元 | `server.js`（全公開関数を使用） |

## 2. 位置づけ・依存関係

### 2.1 依存モジュール

| モジュール | 種別 | 用途 |
|---|---|---|
| `crypto` | Node.js標準 | 固定のセッショントークン算出（SHA-256ハッシュ） |

### 2.2 定数

| 定数 | 値 | 用途 |
|---|---|---|
| `ADMIN_ID` | `'admin'` | 固定のログインID |
| `ADMIN_PASSWORD` | `'admin1234'` | 固定のログインパスワード |
| `SESSION_COOKIE` | `'session'` | ログイン状態を保持するCookie名 |
| `SESSION_TOKEN` | `sha256('admin:admin1234')` | ログイン成功時にCookieへ設定する固定トークン。モジュール読み込み時に一度だけ算出される |

### 2.3 公開関数一覧（`module.exports`）

```
verifyCredentials, isAuthenticated, login, logout, requireLogin
```

## 3. 詳細仕様

### 3.1 内部ユーティリティ関数（非公開）

#### `parseCookies(header)`
- 引数: `header: string`（`Cookie`リクエストヘッダーの値。`undefined`可）
- 戻り値: `Object`（`{ [name: string]: string }`）
- 処理: `;`区切りで分割し、各要素を最初の`=`でキーと値に分割。キーが空でない要素のみ、値を`decodeURIComponent`してオブジェクトに格納する

### 3.2 公開関数

#### `verifyCredentials(id, password)`
- 引数: `id: string`, `password: string`
- 戻り値: `boolean`
- 処理: `id === ADMIN_ID && password === ADMIN_PASSWORD`（単純な文字列比較）

#### `isAuthenticated(req)`
- 引数: `req`（Express Request）
- 戻り値: `boolean`
- 処理: `parseCookies(req.headers.cookie)`の結果から`SESSION_COOKIE`の値を取得し、`SESSION_TOKEN`と一致するかを返す

#### `login(res)`
- 引数: `res`（Express Response）
- 戻り値: なし
- 処理: `res.cookie(SESSION_COOKIE, SESSION_TOKEN, { httpOnly: true, sameSite: 'lax' })`でログイン状態のCookieを発行する

#### `logout(res)`
- 引数: `res`（Express Response）
- 戻り値: なし
- 処理: `res.clearCookie(SESSION_COOKIE)`でCookieを削除する

#### `requireLogin(req, res, next)`
- 引数: Express標準のミドルウェア引数
- 戻り値: なし
- 処理: `isAuthenticated(req)`が`true`なら`next()`を呼び出しリクエスト処理を継続する。`false`なら`res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl))`でログイン画面へ302リダイレクトし、以降の処理を実行しない

## 4. 入出力仕様

| 関数 | 入力 | 出力 |
|---|---|---|
| `verifyCredentials` | 引数のみ | なし |
| `isAuthenticated` | `req.headers.cookie` | なし |
| `login` | なし | `Set-Cookie`レスポンスヘッダー |
| `logout` | なし | `Set-Cookie`レスポンスヘッダー（Cookie削除） |
| `requireLogin` | `req.headers.cookie` | 未認証時は`Location`レスポンスヘッダー（302） |

## 5. 特記事項・留意点

- ID・パスワードはソースコード中の固定値であり、外部設定（環境変数等）による変更には対応していない。変更する場合は`ADMIN_ID`/`ADMIN_PASSWORD`を直接編集し、サーバーを再起動する必要がある。
- `SESSION_TOKEN`はID・パスワードから一意に決まる固定値であり、サーバー再起動やログインの度に変化しない。複数ユーザーの識別・個別のセッション失効・強制ログアウトの機能は持たない（ログインしている全ブラウザが同一のトークンを共有する）。
- パスワードは平文比較（`===`）で検証しており、ハッシュ化・タイミング攻撃対策は行っていない。固定の単一管理者アカウントを想定した簡易実装であり、本番相当のセキュリティ要件がある場合は再検討が必要。
- Cookieには`Secure`属性を付与していないため、HTTPS配信環境で運用する場合は`login()`のCookieオプションに`secure: true`を追加することを検討する。
- `cookie-parser`等の追加パッケージに依存せず、`req.headers.cookie`を自前でパースしている。Express標準の`res.cookie()`/`res.clearCookie()`はExpressの依存パッケージのみで動作するため、追加の依存追加は不要。
