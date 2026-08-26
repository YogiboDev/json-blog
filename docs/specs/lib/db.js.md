# lib/db.js 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | #1: カテゴリー機能を追加（`createPost`に`category`引数追加、`getPostsByCategory`/`getCategories`を新設、`searchPosts`の検索対象に`category`を追加） |
| 1.2 | 2026-08-20 | システム | タグ機能を追加（`getPostsByTag`/`getTags`を新設） |
| 1.3 | 2026-08-20 | システム | #3: `searchPosts`において記事本文からHTMLタグを除去した平文テキストを対象にキーワード検索を行うよう改修 |
| 1.4 | 2026-08-26 | システム | #4: リポスト機能を追加（`createRepost`/`getRepostCounts`/`getFeedPosts`を新設、`deletePost`でリポストのカスケード削除を追加、参照ファイルに`REPOSTS_FILE`を追加） |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `lib/db.js` |
| 役割 | JSONファイル（`data/posts.json`, `data/comments.json`, `data/reposts.json`）に対する読み書き、記事・コメント・リポストのCRUD操作、検索・集計処理を提供するデータアクセス層 |
| 呼び出し元 | `server.js`（全公開関数を使用） |

## 2. 位置づけ・依存関係

### 2.1 依存モジュール

| モジュール | 種別 | 用途 |
|---|---|---|
| `fs` | Node.js標準 | ファイルの同期読み書き（`readFileSync`, `writeFileSync`, `existsSync`） |
| `path` | Node.js標準 | データファイルの絶対パス解決 |

### 2.2 参照ファイル

| 定数 | パス | 用途 |
|---|---|---|
| `POSTS_FILE` | `path.join(__dirname, '..', 'data', 'posts.json')` | 記事データ |
| `COMMENTS_FILE` | `path.join(__dirname, '..', 'data', 'comments.json')` | コメントデータ |
| `REPOSTS_FILE` | `path.join(__dirname, '..', 'data', 'reposts.json')` | リポストデータ |

### 2.3 公開関数一覧（`module.exports`）

```
getAllPosts, getPostById, createPost, deletePost, searchPosts, getPostsByDate,
getPostsByCategory, getCategories, getPostsByTag, getTags, getCommentsByPostId, addComment,
getCommentCounts, createRepost, getRepostCounts, getFeedPosts
```

## 3. 詳細仕様

### 3.1 内部ユーティリティ関数（非公開）

#### `readJson(file)`
- 引数: `file: string`
- 戻り値: `Array`
- 処理: `fs.existsSync(file)`が偽なら`[]`を返す。ファイル内容をtrimして空文字なら`[]`。それ以外は`JSON.parse(raw)`を返す
- 例外: JSON構文が不正な場合、`JSON.parse`が例外を送出する（本モジュールでは捕捉していない）

#### `writeJson(file, data)`
- 引数: `file: string`, `data: Array`
- 戻り値: なし
- 処理: `JSON.stringify(data, null, 2)`でインデント整形しUTF-8で同期書き込み（`fs.writeFileSync`）。ファイル全体を上書きする（差分書き込みではない）

#### `nextId(items)`
- 引数: `items: Array`（各要素が`id`プロパティを持つ）
- 戻り値: `string`
- 処理: 各要素の`id`を`parseInt(id, 10)`し、有効な数値かつ最大の値`m`を求め、`String(m + 1)`を返す。空配列や数値変換不能な`id`のみの場合は`"1"`を返す

### 3.2 記事関連関数

#### `getAllPosts()`
- 引数: なし
- 戻り値: `Post[]`
- 処理: `readJson(POSTS_FILE)`の結果を複製（`slice()`）し、`date`の降順（`new Date(b.date) - new Date(a.date)`）でソートして返す

#### `getPostById(id)`
- 引数: `id: string | number`
- 戻り値: `Post | null`
- 処理: `readJson(POSTS_FILE)`から`p.id === String(id)`が真となる最初の要素。該当なしは`null`

#### `createPost({ title, content, author, tags, category })`
- 引数: `title: string`, `content: string`, `author?: string`, `tags?: string`（カンマ区切り文字列）, `category?: string`
- 戻り値: 作成された`Post`オブジェクト
- 処理:
  1. `posts = readJson(POSTS_FILE)`
  2. `id = nextId(posts)`
  3. `title: title.trim()`, `content: content.trim()`
  4. `author: (author && author.trim()) || '匿名'`
  5. `date: new Date().toISOString()`
  6. `category: (category && category.trim()) || '未分類'`
  7. `tags: (tags || '').split(',').map(t => t.trim()).filter(Boolean)`
  8. `posts.push(post)` の上で `writeJson(POSTS_FILE, posts)`
- 前提: 呼び出し側（`server.js`）で`title`・`content`の必須チェック済みであること

#### `deletePost(id)`
- 引数: `id: string | number`
- 戻り値: なし
- 処理: `posts.json`から`id`一致要素を除外して書き戻す。続けて`comments.json`から`postId`が同一の要素を除外して書き戻し、`reposts.json`からも`postId`が同一の要素を除外して書き戻す（記事削除に伴うコメントおよびリポストのカスケード削除）

#### `searchPosts(query)`
- 引数: `query: string`
- 戻り値: `Post[]`
- 処理: `q = query.trim().toLowerCase()`。`q`が空なら`[]`を返す。`getAllPosts()`（新しい順）に対し、各記事本文からHTMLタグを除去（`p.content.replace(/<[^>]*>/g, ' ')`）した上で、`title + ' ' + content + ' ' + (category || '') + ' ' + (tags || []).join(' ')`を小文字化した文字列に`q`が`includes`されるものを抽出

#### `getPostsByDate(dateStr)`
- 引数: `dateStr: string`（`YYYY-MM-DD`形式）
- 戻り値: `Post[]`
- 処理: `getAllPosts()`のうち`p.date.slice(0, 10) === dateStr`となる記事を抽出

#### `getPostsByCategory(category)`
- 引数: `category: string`
- 戻り値: `Post[]`
- 処理: `getAllPosts()`のうち`(p.category || '未分類') === category`となる記事を抽出（新しい順）

#### `getCategories()`
- 引数: なし
- 戻り値: `{ name: string, count: number }[]`
- 処理: `getAllPosts()`を`category`（未設定時は`'未分類'`）ごとに件数集計し、件数降順・同数の場合は名称の昇順（`localeCompare`）でソートして返す

#### `getPostsByTag(tag)`
- 引数: `tag: string`
- 戻り値: `Post[]`
- 処理: `getAllPosts()`のうち`(p.tags || []).includes(tag)`となる記事を抽出（新しい順）

#### `getTags()`
- 引数: なし
- 戻り値: `{ name: string, count: number }[]`
- 処理: `getAllPosts()`の各記事の`tags`配列を展開し、タグ名ごとに件数を集計。件数降順、同数の場合は名称の昇順（`localeCompare`）でソートして返す

### 3.3 リポスト関連関数

#### `createRepost(postId)`
- 引数: `postId: string | number`
- 戻り値: 作成された`Repost`オブジェクト（`{ id: string, postId: string, date: string }`）、記事未存在時は`null`
- 処理:
  1. `getPostById(postId)`で対象記事の存在確認。未存在なら`null`を返す
  2. `reposts = readJson(REPOSTS_FILE)`
  3. `repost = { id: nextId(reposts), postId: String(postId), date: new Date().toISOString() }`
  4. `reposts.push(repost)`の上で`writeJson(REPOSTS_FILE, reposts)`
  5. 作成された`repost`オブジェクトを返す

#### `getRepostCounts()`
- 引数: なし
- 戻り値: `Object`（`{ [postId: string]: number }`）
- 処理: `readJson(REPOSTS_FILE)`を`reduce`し、`postId`ごとのリポスト件数を集計したオブジェクトを返す

#### `getFeedPosts()`
- 引数: なし
- 戻り値: `Array`（`{ post: Post, isRepost: boolean, repostDate?: string, sortDate: string }[]`）
- 処理:
  1. `posts = readJson(POSTS_FILE)`
  2. `postsById = new Map(posts.map((p) => [p.id, p]))`
  3. `reposts = readJson(REPOSTS_FILE)`
  4. 通常記事を`{ post: p, isRepost: false, sortDate: p.date }`としてマッピング
  5. 各リポストについて`postsById.get(r.postId)`で元記事を取得し、存在すれば`{ post, isRepost: true, repostDate: r.date, sortDate: r.date }`として追加
  6. 全要素を`sortDate`の降順（`new Date(b.sortDate) - new Date(a.sortDate)`）でソートして返す

### 3.4 コメント関連関数

#### `getCommentsByPostId(postId)`
- 引数: `postId: string | number`
- 戻り値: `Comment[]`
- 処理: `readJson(COMMENTS_FILE)`から`c.postId === String(postId)`を抽出し、`date`昇順（投稿順）にソート

#### `addComment(postId, { name, message })`
- 引数: `postId: string | number`, `name?: string`, `message: string`
- 戻り値: 作成された`Comment`オブジェクト
- 処理:
  1. `comments = readJson(COMMENTS_FILE)`
  2. `id = nextId(comments)`
  3. `postId: String(postId)`
  4. `name: (name && name.trim()) || '匿名'`
  5. `message: message.trim()`
  6. `date: new Date().toISOString()`
  7. `comments.push(comment)`の上で`writeJson(COMMENTS_FILE, comments)`
- 前提: 呼び出し側で`message`の必須チェック済みであること

#### `getCommentCounts()`
- 引数: なし
- 戻り値: `Object`（`{ [postId: string]: number }`）
- 処理: `readJson(COMMENTS_FILE)`を`reduce`し、`postId`ごとの件数を集計したオブジェクトを返す

## 4. 入出力仕様

| 関数 | 入力（読み込むファイル） | 出力（書き込むファイル） |
|---|---|---|
| `getAllPosts`, `getPostById`, `searchPosts`, `getPostsByDate`, `getPostsByCategory`, `getCategories`, `getPostsByTag`, `getTags` | `posts.json` | なし |
| `createPost` | `posts.json` | `posts.json` |
| `deletePost` | `posts.json`, `comments.json`, `reposts.json` | `posts.json`, `comments.json`, `reposts.json` |
| `createRepost` | `posts.json`, `reposts.json` | `reposts.json` |
| `getRepostCounts` | `reposts.json` | なし |
| `getFeedPosts` | `posts.json`, `reposts.json` | なし |
| `getCommentsByPostId`, `getCommentCounts` | `comments.json` | なし |
| `addComment` | `comments.json` | `comments.json` |

## 5. 特記事項・留意点

- 全ての読み書きは`fs.*Sync`系APIを使用しており、同期・ブロッキングI/Oである。リクエスト処理中は他のリクエストの処理が待たされるため、高頻度アクセスが想定される環境では非同期化・排他制御の追加を検討すること。
- 複数プロセス・複数リクエストからの同時書き込みに対する排他制御（ファイルロック等）は実装していない。ほぼ同時に`createPost`や`createRepost`が呼ばれた場合、後勝ちで一方の更新が失われる可能性がある。
- `id`は記事・コメント・リポストそれぞれ独立した採番空間であり、値が偶然一致しても`postId`により正しく関連付けられるため問題ない。
- `readJson`はJSON構文エラーを捕捉しないため、`data/*.json`を手動編集する際は構文を崩さないよう注意すること。
- `category`フィールドを持たない既存記事データ（`v1.0`以前に作成されたレコード等）に対しては、`getPostsByCategory`/`getCategories`ともに`'未分類'`として扱うフォールバックを持つため、データ移行なしでそのまま利用できる。
- `tags`フィールドを持たない既存記事データに対しては、`getPostsByTag`/`getTags`ともに`p.tags || []`で空配列として扱うため、データ移行なしでそのまま利用できる（該当記事はタグ集計に一切含まれない）。
- リポストは新しい記事オブジェクトを作らず、`reposts.json`内の参照レコードとして保持される。`getFeedPosts()`では元記事の作成日時ではなくリポスト日時（`repostDate`）をソート基準としてフィード一覧に差し込む。
