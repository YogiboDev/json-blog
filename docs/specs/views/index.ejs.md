# views/index.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | 各記事カードにカテゴリーバッジ（`/categories/:category`へのリンク）を追加 |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/index.ejs` |
| 役割 | 記事一覧画面（SCR-01）、検索結果画面（SCR-04）、およびカテゴリー別記事一覧画面を描画する共通テンプレート |
| 描画元ルート | `GET /`（`server.js`）, `GET /search`（`server.js`）, `GET /categories/:category`（`server.js`） |

## 2. 位置づけ・依存関係

- `partials/header.ejs`, `partials/footer.ejs`をインクルード
- `app.locals.formatDate()`（`server.js`定義）を呼び出し日時整形を行う

## 3. 詳細仕様

### 3.1 受け取る変数（`res.render`から渡される）

| 変数名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `posts` | Post[] | ○ | 表示対象の記事配列（新しい順） |
| `commentCounts` | Object | ○ | `{postId:件数}`のマップ |
| `heading` | string | ○ | ページ見出し（例:「最新の投稿」「検索結果: 「〇〇」」） |
| `emptyMessage` | string | ○ | `posts`が0件のときに表示する文言 |
| `searchQuery` | string | 任意 | 検索結果画面でのみ渡される、検索ボックス復元用の値 |

### 3.2 描画ロジック

1. ヘッダーへ`pageTitle: heading`, `searchQuery`を渡してインクルード
2. `<h1>`に`heading`を表示
3. `posts.length === 0`の場合：`emptyMessage`を`empty-state`クラスで表示
4. それ以外：`posts`を`forEach`し、各記事について以下を`post-card`として表示
   - タイトル（`/posts/:id`へのリンク）
   - 投稿日時（`formatDate(post.date)`）、投稿者（`post.author`）、コメント数（`commentCounts[post.id] || 0`）
   - カテゴリーバッジ：`post.category || '未分類'`を`/categories/{encodeURIComponent(category)}`へのリンクとして表示（`category-badge`クラス）
   - タグ一覧（`post.tags`が存在し1件以上の場合のみ、`tag-list`として表示）
   - 本文抜粋：`post.content.slice(0, 120)` ＋ 120文字超なら`…`を付与

## 4. 入出力仕様

- 入力: 上記変数群（サーバー側で組み立て済み）
- 出力: HTML全体（`header.ejs`＋本体＋`footer.ejs`）

## 5. 特記事項・留意点

- `GET /`, `GET /search`, `GET /categories/:category`の3ルートで同一テンプレートを使い回す設計のため、変数の意味合い（`heading`, `emptyMessage`）は呼び出し元ルートによって内容が変わる。テンプレート自体の分岐ロジックはない。
- 本文抜粋・タイトル・投稿者名等はすべて`<%= %>`によるエスケープ出力でXSS対策済み。
- `post.tags`が未定義の記事データが存在する場合でも`&&`によるガードがあるためエラーにならない。
