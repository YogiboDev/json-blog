# server.js 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | #1: カテゴリー機能を追加（`GET /categories`, `GET /categories/:category`、`POST /posts`に`category`パラメータ追加） |
| 1.2 | 2026-08-20 | システム | タグ機能を追加（`GET /tags`, `GET /tags/:tag`） |
| 1.3 | 2026-08-20 | システム | ログイン機能を追加（`GET/POST /login`, `POST /logout`。`GET /new`, `POST /posts`に`auth.requireLogin`ミドルウェアを適用。全リクエストに`res.locals.isAuthenticated`を設定する共通ミドルウェアを追加） |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `server.js` |
| 役割 | アプリケーションのエントリポイント。Expressサーバーの初期化、ミドルウェア設定、全HTTPルーティングの定義を行う |
| 実行方法 | `node server.js`（`npm start`）。環境変数`PORT`未指定時は`3000`番ポートで待受 |

## 2. 位置づけ・依存関係

### 2.1 依存モジュール

| モジュール | 種別 | 用途 |
|---|---|---|
| `express` | 外部パッケージ | HTTPサーバー・ルーティング |
| `path` | Node.js標準 | ビュー／静的ファイルの絶対パス解決 |
| `./lib/db` | 自作モジュール | 記事・コメントのデータアクセス関数群 |
| `./lib/auth` | 自作モジュール | 固定ID・パスワードによる認証判定、ログイン状態Cookieの発行・検証、ログイン必須ミドルウェア |

### 2.2 呼び出し関係

- `server.js` → `lib/db.js`の全公開関数を呼び出す
- `server.js` → `lib/auth.js`の全公開関数を呼び出す
- `server.js` → `views/*.ejs`を`res.render()`で描画
- `server.js` → `public/`配下を`express.static`で静的配信

## 3. 詳細仕様

### 3.1 初期設定

| 設定項目 | 内容 |
|---|---|
| ビューエンジン | `app.set('view engine', 'ejs')` |
| ビューディレクトリ | `path.join(__dirname, 'views')` |
| ボディパーサー | `express.urlencoded({ extended: true })`（フォーム送信用）, `express.json()` |
| 静的配信 | `express.static(path.join(__dirname, 'public'))` |

### 3.2 共通ヘルパー関数

#### `formatDate(iso)`

| 項目 | 内容 |
|---|---|
| 引数 | `iso: string` — ISO8601形式の日時文字列 |
| 戻り値 | `string` — `ja-JP`ロケールの`YYYY/MM/DD HH:mm`相当の表記 |
| 実装 | `new Date(iso).toLocaleString('ja-JP', { year, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })` |
| 公開範囲 | `app.locals.formatDate`に登録し、全EJSテンプレートから`formatDate()`として呼び出し可能 |

### 3.3 共通ミドルウェア

| 項目 | 内容 |
|---|---|
| 処理 | 全リクエストに対し`res.locals.isAuthenticated = auth.isAuthenticated(req)`を設定 |
| 目的 | 全EJSテンプレート（`partials/header.ejs`のログイン／ログアウト表示切り替え）から`isAuthenticated`を参照可能にする |
| 登録位置 | ボディパーサー・静的配信設定の直後、全ルート定義より前 |

### 3.4 ルート定義一覧

| # | メソッド | パス | 処理概要 |
|---|---|---|---|
| 1 | GET | `/` | 全記事一覧＋コメント数を取得し`index.ejs`を描画 |
| 2 | GET | `/new` | ログイン必須（`auth.requireLogin`）。`new-post.ejs`を`error: null`で描画 |
| 3 | POST | `/posts` | ログイン必須（`auth.requireLogin`）。記事新規作成。バリデーションNGならHTTP 400で`new-post.ejs`再描画、成功時は`/posts/:id`へ302リダイレクト |
| 4 | GET | `/search` | クエリ`q`で`db.searchPosts()`を実行し`index.ejs`を描画（一覧テンプレート流用） |
| 5 | GET | `/calendar` | クエリ`year`,`month`,`date`をもとにカレンダー用データを組み立て`calendar.ejs`を描画 |
| 6 | GET | `/posts/:id` | 記事詳細取得。存在しなければHTTP 404で`404.ejs`。存在すれば`post.ejs`を描画 |
| 7 | POST | `/posts/:id/comments` | コメント新規作成。記事なしはHTTP 404、本文空はHTTP 400で`post.ejs`再描画。成功時は`/posts/:id#comments`へ302リダイレクト |
| 8 | POST | `/posts/:id/delete` | 記事削除（コメントもカスケード削除）。記事なしはHTTP 404。成功時は`/`へ302リダイレクト |
| 9 | GET | `/categories` | `db.getCategories()`で件数付きカテゴリー一覧を取得し`categories.ejs`を描画 |
| 10 | GET | `/categories/:category` | `db.getPostsByCategory(category)`で該当記事一覧を取得し`index.ejs`を描画（一覧テンプレート流用） |
| 11 | GET | `/tags` | `db.getTags()`で件数付きタグ一覧を取得し`tags.ejs`を描画 |
| 12 | GET | `/tags/:tag` | `db.getPostsByTag(tag)`で該当記事一覧を取得し`index.ejs`を描画（一覧テンプレート流用） |
| 13 | GET | `/login` | `login.ejs`を`error: null`で描画 |
| 14 | POST | `/login` | ID・パスワード検証。成功時はセッションCookie発行し`redirect`（既定`/`）へ302リダイレクト、失敗時はHTTP 400で`login.ejs`再描画 |
| 15 | POST | `/logout` | セッションCookieを削除し`/`へ302リダイレクト |
| 16 | ALL（フォールバック） | 上記以外全て | HTTP 404で`404.ejs`を描画 |

### 3.5 ルート個別仕様

#### GET `/`
- 入力: なし
- 処理: `db.getAllPosts()`, `db.getCommentCounts()`
- 出力変数: `posts`, `commentCounts`, `heading: '最新の投稿'`, `emptyMessage: 'まだ投稿がありません。'`

#### GET `/new`
- 前置ミドルウェア: `auth.requireLogin`（未ログイン時は`/login?redirect=/new`へ302リダイレクトし、以降未実行）
- 出力変数: `error: null`, `categories`（`db.getCategories()`。既存カテゴリーの入力補助用`<datalist>`向け）

#### POST `/posts`
- 前置ミドルウェア: `auth.requireLogin`（未ログイン時は`/login?redirect=/posts`へ302リダイレクトし、以降未実行）
- 入力: `req.body.title`, `req.body.content`, `req.body.author`, `req.body.tags`, `req.body.category`
- バリデーション: `title`または`content`が空白のみ／未指定 → HTTP 400、`new-post.ejs`を`{ error: 'タイトルと本文は必須です。', categories: db.getCategories() }`で再描画
- 正常系: `db.createPost({ title, content, author, tags, category })` → `res.redirect('/posts/' + post.id)`

#### GET `/search`
- 入力: `req.query.q`（未指定時は空文字扱い）
- 処理: `q.trim()`が真なら`db.searchPosts(q)`、偽なら`results = []`
- 出力変数: `posts: results`, `commentCounts`, `heading`, `emptyMessage`（検索有無で文言分岐）, `searchQuery: q`

#### GET `/calendar`
- 入力: `req.query.year`, `req.query.month`（数値変換、未指定/不正値は当日基準）, `req.query.date`（`YYYY-MM-DD`）
- 処理:
  1. `firstOfMonth = new Date(year, month-1, 1)`で月初の曜日（`getDay()`）を取得
  2. `daysInMonth = new Date(year, month, 0).getDate()`で当月日数を取得
  3. 全記事から`countsByDate`（日付文字列→件数）を集計
  4. 1日〜末日を`week`配列（7要素）に積み、7要素に達するごとに`weeks`へpush。月初の空白は`null`で埋める
  5. 前月・翌月の年月を算出（1月/12月をまたぐ場合の繰り上げ・繰り下げ処理を含む）
  6. `date`指定時は`db.getPostsByDate(date)`で該当日記事一覧を取得
- 出力変数: `year`, `month`, `weeks`, `prevYear`, `prevMonth`, `nextYear`, `nextMonth`, `selectedDate`, `selectedPosts`, `commentCounts`, `todayStr`

#### GET `/posts/:id`
- 入力: `req.params.id`
- 処理: `db.getPostById(id)` → 未存在ならHTTP 404 `404.ejs`。存在すれば`db.getCommentsByPostId(id)`
- 出力変数: `post`, `comments`, `error: null`

#### POST `/posts/:id/comments`
- 入力: `req.params.id`, `req.body.name`, `req.body.message`
- バリデーション: 記事未存在→HTTP 404。`message`空→HTTP 400、`post.ejs`を`comments`（再取得）と`error: 'コメント内容を入力してください。'`で再描画
- 正常系: `db.addComment(post.id, { name, message })` → `res.redirect('/posts/' + post.id + '#comments')`

#### POST `/posts/:id/delete`
- 入力: `req.params.id`
- 処理: 記事未存在→HTTP 404。存在すれば`db.deletePost(post.id)` → `res.redirect('/')`

#### GET `/categories`
- 入力: なし
- 処理: `db.getCategories()`
- 出力変数: `categories`（`{name, count}[]`、件数降順・同数は名称昇順）

#### GET `/categories/:category`
- 入力: `req.params.category`（URLデコード済みのカテゴリー名）
- 処理: `db.getPostsByCategory(category)`, `db.getCommentCounts()`
- 出力変数: `posts`, `commentCounts`, `heading: 'カテゴリー: 「' + category + '」'`, `emptyMessage: 'このカテゴリーの記事はまだありません。'`
- 描画テンプレート: `index.ejs`（一覧画面を流用）

#### GET `/tags`
- 入力: なし
- 処理: `db.getTags()`
- 出力変数: `tags`（`{name, count}[]`、件数降順・同数は名称昇順）

#### GET `/tags/:tag`
- 入力: `req.params.tag`（URLデコード済みのタグ名）
- 処理: `db.getPostsByTag(tag)`, `db.getCommentCounts()`
- 出力変数: `posts`, `commentCounts`, `heading: 'タグ: 「' + tag + '」'`, `emptyMessage: 'このタグの記事はまだありません。'`
- 描画テンプレート: `index.ejs`（一覧画面を流用）

#### GET `/login`
- 入力: `req.query.redirect`（省略時は`'/'`）
- 出力変数: `error: null`, `redirect: (req.query.redirect || '/').toString()`

#### POST `/login`
- 入力: `req.body.id`, `req.body.password`, `req.body.redirect`
- 処理: `auth.verifyCredentials(id, password)`
- 正常系: `auth.login(res)`でセッションCookieを発行し、`res.redirect(redirect || '/')`
- 異常系: HTTP 400で`login.ejs`を`{ error: 'IDまたはパスワードが正しくありません。', redirect: redirect || '/' }`で再描画

#### POST `/logout`
- 処理: `auth.logout(res)`でセッションCookieを削除
- 正常系: `res.redirect('/')`

#### フォールバック（404）
- `app.use((req, res) => res.status(404).render('404'))` — 定義済みルートに一致しない全リクエストを捕捉

## 4. 入出力仕様

| 入力元 | 形式 |
|---|---|
| フォーム送信 | `application/x-www-form-urlencoded`（`req.body`） |
| クエリパラメータ | `req.query`（検索キーワード、カレンダー年月・日付） |
| パスパラメータ | `req.params.id`（記事ID） |

| 出力 | 形式 |
|---|---|
| 通常応答 | EJSでレンダリングしたHTML |
| 登録・削除成功時 | HTTP 302リダイレクト |
| バリデーションエラー | 該当画面をHTTP 400で再描画 |
| リソース未存在 | HTTP 404で`404.ejs` |

## 5. 特記事項・留意点

- ルーティングの順序に依存する処理はない（`/search`と`/posts/:id`はパスパターンが重複しないため定義順の影響を受けない）。
- リクエストパラメータの型変換（`parseInt`）に失敗した場合（`NaN`）は、`year`・`month`ともに`||`演算子により当日の値へフォールバックする。
- サーバー起動ログは標準出力に`Blog server running at http://localhost:${PORT}`を出力する。
- `POST /posts/:id/delete`にはログイン必須化を適用していない（本バージョンでは`/new`, `/posts`のみを対象とする）。
