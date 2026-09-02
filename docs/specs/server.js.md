# server.js 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | #1: カテゴリー機能を追加（`GET /categories`, `GET /categories/:category`、`POST /posts`に`category`パラメータ追加） |
| 1.2 | 2026-08-20 | システム | タグ機能を追加（`GET /tags`, `GET /tags/:tag`） |
| 1.3 | 2026-08-20 | システム | #2: ログイン機能を追加（`GET/POST /login`, `POST /logout`。`GET /new`, `POST /posts`に`auth.requireLogin`ミドルウェアを適用。全リクエストに`res.locals.isAuthenticated`を設定する共通ミドルウェアを追加） |
| 1.4 | 2026-08-20 | システム | #3: TinyMCE静的配信（`/tinymce`, `/tinymce/langs`）を追加。記事一覧等の抜粋表示用にHTMLタグ・実体参照を除去する共通ヘルパー`stripHtml`（`app.locals.stripHtml`）を追加 |
| 1.5 | 2026-08-26 | システム | #4: リポスト機能を追加（`POST /posts/:id/repost`ルート新設（ログイン必須）、`wrapPosts`ヘルパー追加、各一覧ルート（`/`, `/categories/:category`, `/tags/:tag`, `/search`）および詳細ルート（`/posts/:id`）でリポスト件数・リポスト記事対応） |
| 1.6 | 2026-09-02 | システム | #5: RSSフィード（`GET /rss.xml`）の出力件数上限を20件から100件に変更。共通ヘルパー`escapeXml`を追加 |

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
| `./lib/db` | 自作モジュール | 記事・コメント・リポストのデータアクセス関数群 |
| `./lib/auth` | 自作モジュール | 固定ID・パスワードによる認証判定、ログイン状態Cookieの発行・検証、ログイン必須ミドルウェア |

### 2.2 呼び出し関係

- `server.js` → `lib/db.js`の全公開関数を呼び出す
- `server.js` → `lib/auth.js`の全公開関数を呼び出す
- `server.js` → `views/*.ejs`を`res.render()`で描画
- `server.js` → `public/`配下および`node_modules/tinymce`, `node_modules/tinymce-i18n/langs8`配下を`express.static`で静的配信

## 3. 詳細仕様

### 3.1 初期設定

| 設定項目 | 内容 |
|---|---|
| ビューエンジン | `app.set('view engine', 'ejs')` |
| ビューディレクトリ | `path.join(__dirname, 'views')` |
| ボディパーサー | `express.urlencoded({ extended: true })`（フォーム送信用）, `express.json()` |
| 静的配信 | `express.static(path.join(__dirname, 'public'))`（`/`直下）<br>`/tinymce` → `express.static(path.join(__dirname, 'node_modules', 'tinymce'))`<br>`/tinymce/langs` → `express.static(path.join(__dirname, 'node_modules', 'tinymce-i18n', 'langs8'))` |

### 3.2 共通ヘルパー関数

#### `formatDate(iso)`

| 項目 | 内容 |
|---|---|
| 引数 | `iso: string` — ISO8601形式の日時文字列 |
| 戻り値 | `string` — `ja-JP`ロケールの`YYYY/MM/DD HH:mm`相当の表記 |
| 実装 | `new Date(iso).toLocaleString('ja-JP', { year, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })` |
| 公開範囲 | `app.locals.formatDate`に登録し、全EJSテンプレートから`formatDate()`として呼び出し可能 |

#### `stripHtml(html)`

| 項目 | 内容 |
|---|---|
| 引数 | `html: string` — HTML文字列 |
| 戻り値 | `string` — HTMLタグおよび実体参照を除去し、空白を正規化した平文テキスト |
| 実装 | タグ（`<[^>]*>`）および`&nbsp;`を半角スペースに、`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`を対応する記号に置換後、連続空白（`\s+`）を単一スペースに置換して`trim()` |
| 公開範囲 | `app.locals.stripHtml`に登録し、全EJSテンプレートから`stripHtml()`として呼び出し可能 |

#### `wrapPosts(posts)`

| 項目 | 内容 |
|---|---|
| 引数 | `posts: Post[]` — 記事配列 |
| 戻り値 | `Array` — `posts.map((post) => ({ post, isRepost: false, sortDate: post.date }))` |
| 実装 | カテゴリー別・タグ別・検索結果一覧等で、通常記事配列を`index.ejs`が要求する`items`形式へ変換する内部ヘルパー |
| 公開範囲 | モジュール内部（非公開） |

#### `escapeXml(str)`

| 項目 | 内容 |
|---|---|
| 引数 | `str: string` — エスケープ対象の文字列 |
| 戻り値 | `string` — XML特殊文字（`&`, `<`, `>`, `"`, `'`）を実体参照（`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`）に置換した文字列 |
| 実装 | `String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')` |
| 公開範囲 | モジュール内部（非公開） |

### 3.3 共通ミドルウェア

| 項目 | 内容 |
|---|---|
| 処理 | 全リクエストに対し`res.locals.isAuthenticated = auth.isAuthenticated(req)`を設定 |
| 目的 | 全EJSテンプレート（`partials/header.ejs`のログイン／ログアウト表示切り替え、`index.ejs`/`post.ejs`のリポストボタン表示切り替え）から`isAuthenticated`を参照可能にする |
| 登録位置 | ボディパーサー・静的配信設定の直後、全ルート定義より前 |

### 3.4 ルート定義一覧

| # | メソッド | パス | 処理概要 |
|---|---|---|---|
| 1 | GET | `/` | 全記事（リポスト含む）＋コメント数＋リポスト数を取得し`index.ejs`を描画 |
| 2 | GET | `/rss.xml` | 最新記事を最大100件取得し、RSS 2.0形式のXML（`application/rss+xml`）を出力 |
| 3 | GET | `/new` | ログイン必須（`auth.requireLogin`）。`new-post.ejs`を`error: null`で描画 |
| 4 | POST | `/posts` | ログイン必須（`auth.requireLogin`）。記事新規作成。バリデーションNGならHTTP 400で`new-post.ejs`再描画、成功時は`/posts/:id`へ302リダイレクト |
| 5 | GET | `/search` | クエリ`q`で`db.searchPosts()`を実行し、リポスト件数を含めて`index.ejs`を描画（一覧テンプレート流用） |
| 6 | GET | `/calendar` | クエリ`year`,`month`,`date`をもとにカレンダー用データを組み立て`calendar.ejs`を描画 |
| 7 | GET | `/posts/:id` | 記事詳細取得。リポスト件数を算出して`post.ejs`を描画。存在しなければHTTP 404で`404.ejs` |
| 8 | POST | `/posts/:id/repost` | ログイン必須（`auth.requireLogin`）。記事リポスト作成。記事なしはHTTP 404。成功時は`/`へ302リダイレクト |
| 9 | POST | `/posts/:id/comments` | コメント新規作成。記事なしはHTTP 404、本文空はHTTP 400で`post.ejs`再描画。成功時は`/posts/:id#comments`へ302リダイレクト |
| 10 | POST | `/posts/:id/delete` | 記事削除（コメント・リポストもカスケード削除）。記事なしはHTTP 404。成功時は`/`へ302リダイレクト |
| 11 | GET | `/categories` | `db.getCategories()`で件数付きカテゴリー一覧を取得し`categories.ejs`を描画 |
| 12 | GET | `/categories/:category` | `db.getPostsByCategory(category)`で該当記事一覧を取得し、リポスト件数を含めて`index.ejs`を描画（一覧テンプレート流用） |
| 13 | GET | `/tags` | `db.getTags()`で件数付きタグ一覧を取得し`tags.ejs`を描画 |
| 14 | GET | `/tags/:tag` | `db.getPostsByTag(tag)`で該当記事一覧を取得し、リポスト件数を含めて`index.ejs`を描画（一覧テンプレート流用） |
| 15 | GET | `/login` | `login.ejs`を`error: null`で描画 |
| 16 | POST | `/login` | ID・パスワード検証。成功時はセッションCookie発行し`redirect`（既定`/`）へ302リダイレクト、失敗時はHTTP 400で`login.ejs`再描画 |
| 17 | POST | `/logout` | セッションCookieを削除し`/`へ302リダイレクト |
| 18 | ALL（フォールバック） | 上記以外全て | HTTP 404で`404.ejs`を描画 |

### 3.5 ルート個別仕様

#### GET `/`
- 入力: なし
- 処理: `db.getFeedPosts()`, `db.getCommentCounts()`, `db.getRepostCounts()`
- 出力変数: `items`, `commentCounts`, `repostCounts`, `heading: '最新の投稿'`, `emptyMessage: 'まだ投稿がありません。'`

#### GET `/rss.xml`
- 入力: なし
- 処理:
  1. `db.getAllPosts().slice(0, 100)` で最新投稿を最大100件取得
  2. サイトURL（`${req.protocol}://${req.get('host')}`）を構築
  3. 各記事のタイトル・リンク・GUID・公開日時（UTC）・投稿者・抜粋（`stripHtml(post.content).slice(0, 300)`）を`escapeXml`でエスケープし、`<item>`タグを組み立て
  4. 最終更新日時（`lastBuildDate`）を設定し、RSS 2.0形式のXMLドキュメントを構築
- 出力: `Content-Type: application/rss+xml; charset=utf-8` でXML文字列を送信

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
- 処理: `q.trim()`が真なら`db.searchPosts(q)`、偽なら`results = []`。`wrapPosts(results)`、`db.getCommentCounts()`、`db.getRepostCounts()`を取得
- 出力変数: `items: wrapPosts(results)`, `commentCounts`, `repostCounts`, `heading`, `emptyMessage`（検索有無で文言分岐）, `searchQuery: q`

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
- 処理: `db.getPostById(id)` → 未存在ならHTTP 404 `404.ejs`。存在すれば`db.getCommentsByPostId(id)`、`repostCount = db.getRepostCounts()[post.id] || 0`
- 出力変数: `post`, `comments`, `error: null`, `repostCount`

#### POST `/posts/:id/repost`
- 前置ミドルウェア: `auth.requireLogin`（未ログイン時は`/login?redirect=/posts/:id/repost`へ302リダイレクト）
- 入力: `req.params.id`
- 処理: `db.getPostById(id)` → 未存在ならHTTP 404 `404.ejs`。存在すれば`db.createRepost(post.id)`
- 正常系: `res.redirect('/')`

#### POST `/posts/:id/comments`
- 入力: `req.params.id`, `req.body.name`, `req.body.message`
- バリデーション: 記事未存在→HTTP 404。`message`空→HTTP 400、`post.ejs`を`comments`（再取得）と`error: 'コメント内容を入力してください。'`で再描画
- 正常系: `db.addComment(post.id, { name, message })` → `res.redirect('/posts/' + post.id + '#comments')`

#### POST `/posts/:id/delete`
- 入力: `req.params.id`
- 処理: 記事未存在→HTTP 404。存在すれば`db.deletePost(post.id)`（コメント・リポストもカスケード削除） → `res.redirect('/')`

#### GET `/categories`
- 入力: なし
- 処理: `db.getCategories()`
- 出力変数: `categories`（`{name, count}[]`、件数降順・同数は名称昇順）

#### GET `/categories/:category`
- 入力: `req.params.category`（URLデコード済みのカテゴリー名）
- 処理: `db.getPostsByCategory(category)`, `db.getCommentCounts()`, `db.getRepostCounts()`
- 出力変数: `items: wrapPosts(posts)`, `commentCounts`, `repostCounts`, `heading: 'カテゴリー: 「' + category + '」'`, `emptyMessage: 'このカテゴリーの記事はまだありません。'`
- 描画テンプレート: `index.ejs`（一覧画面を流用）

#### GET `/tags`
- 入力: なし
- 処理: `db.getTags()`
- 出力変数: `tags`（`{name, count}[]`、件数降順・同数は名称昇順）

#### GET `/tags/:tag`
- 入力: `req.params.tag`（URLデコード済みのタグ名）
- 処理: `db.getPostsByTag(tag)`, `db.getCommentCounts()`, `db.getRepostCounts()`
- 出力変数: `items: wrapPosts(posts)`, `commentCounts`, `repostCounts`, `heading: 'タグ: 「' + tag + '」'`, `emptyMessage: 'このタグの記事はまだありません。'`
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
| パスパラメータ | `req.params.id`（記事ID）, `req.params.category`, `req.params.tag` |

| 出力 | 形式 |
|---|---|
| 通常応答 | EJSでレンダリングしたHTML |
| RSSフィード | `application/rss+xml; charset=utf-8`（RSS 2.0 XML） |
| 登録・削除・リポスト成功時 | HTTP 302リダイレクト |
| バリデーションエラー | 該当画面をHTTP 400で再描画 |
| リソース未存在 | HTTP 404で`404.ejs` |

## 5. 特記事項・留意点

- ルーティングの順序に依存する処理はない（`/search`と`/posts/:id`はパスパターンが重複しないため定義順の影響を受けない）。
- リクエストパラメータの型変換（`parseInt`）に失敗した場合（`NaN`）は、`year`・`month`ともに`||`演算子により当日の値へフォールバックする。
- サーバー起動ログは標準出力に`Blog server running at http://localhost:${PORT}`を出力する。
- `POST /posts/:id/delete`にはログイン必須化を適用していない（本バージョンでは`/new`, `/posts`, `/posts/:id/repost`を対象とする）。
- `POST /posts/:id/repost`はリポスト作成後、トップページ（`/`）へ302リダイレクトする。
- `GET /rss.xml`は最新記事を最大100件取得し、RSS 2.0仕様に基づきXML形式で配信する。各アイテムの説明（`<description>`）にはHTMLタグを除去した先頭300文字を出力し、特殊文字は`escapeXml`によりXMLエスケープされる。
