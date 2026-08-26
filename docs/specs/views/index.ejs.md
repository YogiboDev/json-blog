# views/index.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | #1: 各記事カードにカテゴリーバッジ（`/categories/:category`へのリンク）を追加 |
| 1.2 | 2026-08-20 | システム | 各記事カードのタグを`/tags/:tag`へのリンクに変更 |
| 1.3 | 2026-08-20 | システム | #3: TinyMCE導入に伴い、本文抜粋生成処理を`stripHtml(post.content)`でHTMLタグを除去した平文テキストを対象とするよう変更 |
| 1.4 | 2026-08-26 | システム | #4: リポスト機能に対応（受け取る変数を`items`に変更、`repostCounts`を追加、リポストバナー表示、リポスト件数表示、ログイン時のリポストボタン表示を追加） |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/index.ejs` |
| 役割 | 記事一覧画面（SCR-01）、検索結果画面（SCR-04）、およびカテゴリー別記事一覧画面を描画する共通テンプレート |
| 描画元ルート | `GET /`（`server.js`）, `GET /search`（`server.js`）, `GET /categories/:category`（`server.js`）, `GET /tags/:tag`（`server.js`） |

## 2. 位置づけ・依存関係

- `partials/header.ejs`, `partials/footer.ejs`をインクルード
- `app.locals.formatDate()`（`server.js`定義）を呼び出し日時整形を行う
- `app.locals.stripHtml()`（`server.js`定義）を呼び出し本文のHTMLタグ・実体参照の除去を行う
- `res.locals.isAuthenticated`（`server.js`共通ミドルウェア）を参照してリポストフォームの表示制御を行う

## 3. 詳細仕様

### 3.1 受け取る変数（`res.render`から渡される）

| 変数名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `items` | Array | ○ | 表示対象の記事アイテム配列（`{ post: Post, isRepost: boolean, repostDate?: string, sortDate: string }[]`） |
| `commentCounts` | Object | ○ | `{postId:件数}`のマップ |
| `repostCounts` | Object | ○ | `{postId:件数}`のリポスト件数マップ |
| `heading` | string | ○ | ページ見出し（例:「最新の投稿」「検索結果: 「〇〇」」） |
| `emptyMessage` | string | ○ | `items`が0件のときに表示する文言 |
| `searchQuery` | string | 任意 | 検索結果画面でのみ渡される、検索ボックス復元用の値 |

### 3.2 描画ロジック

1. ヘッダーへ`pageTitle: heading`, `searchQuery`を渡してインクルード
2. `<h1>`に`heading`を表示
3. `items.length === 0`の場合：`emptyMessage`を`empty-state`クラスで表示
4. それ以外：`items`を`forEach`し、各要素（`item`、`post = item.post`）について以下を`post-card`として表示
   - リポストバナー：`item.isRepost`が真の場合、`repost-banner`クラスで`🔁 <%= formatDate(item.repostDate) %> にリポストされました`を表示
   - タイトル（`/posts/:id`へのリンク）
   - 投稿日時（`formatDate(post.date)`）、投稿者（`post.author`）、コメント数（`commentCounts[post.id] || 0`）、リポスト件数（`repostCounts[post.id] || 0`）
   - カテゴリーバッジ：`post.category || '未分類'`を`/categories/{encodeURIComponent(category)}`へのリンクとして表示（`category-badge`クラス）
   - タグ一覧（`post.tags`が存在し1件以上の場合のみ、`tag-list`として表示。各タグは`/tags/{encodeURIComponent(tag)}`へのリンク、`tag`クラス）
   - 本文抜粋：`var excerptText = stripHtml(post.content);` で平文テキスト化し、`excerptText.slice(0, 120)` ＋ 120文字超なら`…`を付与
   - リポストボタン：`isAuthenticated`が真の場合、`repost-form`クラスの`<form action="/posts/<%= post.id %>/repost" method="POST">`と`<button type="submit" class="btn-repost">🔁 リポスト</button>`を表示

## 4. 入出力仕様

- 入力: 上記変数群（サーバー側で組み立て済み）
- 出力: HTML全体（`header.ejs`＋本体＋`footer.ejs`）

## 5. 特記事項・留意点

- `GET /`, `GET /search`, `GET /categories/:category`, `GET /tags/:tag`の4ルートで同一テンプレートを使い回す設計のため、変数の意味合い（`heading`, `emptyMessage`）は呼び出し元ルートによって内容が変わる。
- 本文抜粋・タイトル・投稿者名等はすべて`<%= %>`によるエスケープ出力でXSS対策済み。
- `post.tags`が未定義の記事データが存在する場合でも`&&`によるガードがあるためエラーにならない。
- リポストされた投稿は、元記事の内容を表示しつつ上部にリポスト日時バナーが表示される。
