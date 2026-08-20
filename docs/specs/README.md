# ファイル仕様書 索引

各プログラムファイルの詳細仕様は以下を参照。全ファイル、冒頭に改訂履歴を持つ。

本ディレクトリは、実際のプログラムと同じディレクトリ階層構造を持つ（例: `views/post.ejs` の仕様書は `views/post.ejs.md`）。

| ファイル | 仕様書 |
|---|---|
| `server.js` | [server.js.md](server.js.md) |
| `lib/db.js` | [lib/db.js.md](lib/db.js.md) |
| `views/partials/header.ejs` | [views/partials/header.ejs.md](views/partials/header.ejs.md) |
| `views/partials/footer.ejs` | [views/partials/footer.ejs.md](views/partials/footer.ejs.md) |
| `views/index.ejs` | [views/index.ejs.md](views/index.ejs.md) |
| `views/post.ejs` | [views/post.ejs.md](views/post.ejs.md) |
| `views/new-post.ejs` | [views/new-post.ejs.md](views/new-post.ejs.md) |
| `views/categories.ejs` | [views/categories.ejs.md](views/categories.ejs.md) |
| `views/tags.ejs` | [views/tags.ejs.md](views/tags.ejs.md) |
| `views/calendar.ejs` | [views/calendar.ejs.md](views/calendar.ejs.md) |
| `views/404.ejs` | [views/404.ejs.md](views/404.ejs.md) |
| `public/css/style.css` | [public/css/style.css.md](public/css/style.css.md) |

## 改訂履歴の運用ルール

各仕様書冒頭の「改訂履歴」表に、対象ファイルを変更するたびに以下の形式で1行追加すること。

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.1 | YYYY-MM-DD | 変更者名 | 変更内容の要約 |

- 版数は変更のたびに小数点以下を1つ繰り上げる（軽微な修正）。仕様の大幅な変更（機能追加・インターフェース変更等）の場合は整数部を繰り上げる。
- 既存の履歴行は削除・上書きせず、必ず追記する。
