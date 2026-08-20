# public/css/style.css 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |
| 1.1 | 2026-08-19 | システム | #1: カテゴリーバッジ（`.category-badge`）およびカテゴリー一覧画面（`.category-list`系）のスタイルを追加 |
| 1.2 | 2026-08-20 | システム | `.tag`をリンク要素として使えるよう`text-decoration: none`とホバー時の配色（`.tag:hover`）を追加 |
| 1.3 | 2026-08-20 | システム | #2: ヘッダーのログアウトボタン用に`.logout-form`, `.link-button`, `.link-button:hover`を追加 |
| 1.4 | 2026-08-20 | システム | #3: TinyMCE導入に伴い、`.post-content`から`white-space: pre-wrap`を削除し、`.post-content p`、`.post-content ul, .post-content ol`、`.post-content blockquote`のスタイルを追加 |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `public/css/style.css` |
| 役割 | 全画面共通のスタイル定義。フレームワークを使用しない素のCSS |
| 配信方法 | `express.static('public')`により`/css/style.css`として配信され、`partials/header.ejs`の`<link>`から読み込まれる |

## 2. 位置づけ・依存関係

- 依存ライブラリなし（自己完結したCSSファイル）
- 対象テンプレート：`views/*.ejs`全体で使用するクラス・要素セレクタを定義

## 3. 詳細仕様

### 3.1 デザイントークン（`:root`カスタムプロパティ）

| 変数名 | 用途 |
|---|---|
| `--bg` | ページ全体の背景色 |
| `--surface` | カード・ヘッダー等の面の背景色 |
| `--text` | 基本文字色 |
| `--text-muted` | 補助的な文字色（メタ情報等） |
| `--border` | 罫線・区切り線の色 |
| `--accent` / `--accent-dark` | アクセントカラー（リンク・ボタン・ホバー） |
| `--danger` | 削除ボタン・エラーメッセージの警告色 |

### 3.2 主要セクションとセレクタ対応

| セクション | 主なセレクタ | 対応画面/要素 |
|---|---|---|
| 共通レイアウト | `.container`, `body`, `*` | 全画面の余白・幅・フォント |
| ヘッダー | `.site-header`, `.header-inner`, `.logo`, `.main-nav`, `.search-form`, `.logout-form`, `.link-button` | `partials/header.ejs` |
| メイン領域 | `main.container`, `.page-title` | 各画面の見出し |
| 記事一覧 | `.post-list`, `.post-card`, `.post-card-title`, `.post-meta`, `.tag-list`, `.tag`, `.post-excerpt`, `.empty-state` | `index.ejs`, `calendar.ejs`（選択日一覧） |
| カテゴリー | `.category-badge`, `.category-list`, `.category-list-item`, `.category-count` | `index.ejs`, `post.ejs`（バッジ）、`categories.ejs`（一覧） |
| タグ | `.tag`, `.tag:hover`, `.category-list`, `.category-list-item`, `.category-count` | `index.ejs`, `post.ejs`（`.tag`）、`tags.ejs`（一覧、`categories.ejs`と同じ`.category-list`系クラスを流用） |
| 記事詳細 | `.post-detail`, `.post-content`, `.post-content p`, `.post-content ul`, `.post-content ol`, `.post-content blockquote`, `.delete-form`, `.btn-danger` | `post.ejs` |
| コメント | `.comments-section`, `.comment-list`, `.comment-item`, `.comment-meta`, `.comment-message`, `.comment-form` | `post.ejs` |
| 投稿フォーム | `.post-form`, `.required` | `new-post.ejs` |
| エラー表示 | `.error-message` | `new-post.ejs`, `post.ejs` |
| カレンダー | `.calendar-nav`, `.calendar-title`, `.calendar-table`, `.today`, `.selected`, `.day-num`, `.post-count`, `.calendar-selected` | `calendar.ejs` |
| フッター | `.site-footer` | `partials/footer.ejs` |
| 404 | `.not-found` | `404.ejs` |

### 3.3 特殊なスタイル指定

| セレクタ | 指定内容 | 目的 |
|---|---|---|
| `.comment-message` | `white-space: pre-wrap` | サーバー側でHTML変換していない改行文字（`\n`）をそのまま見た目上の改行として表示するため（XSS対策としてコメント本文をHTMLエスケープ出力しているための対応） |
| `.post-content p`, `.post-content ul`, `.post-content ol`, `.post-content blockquote` | 下部マージン（`1em`）、リスト余白、引用左罫線・文字色など | TinyMCEで生成されたHTML記事本文（段落・リスト・引用）の適切なレイアウト・余白を整えるため |
| `.calendar-table td.today` | 背景色を淡いアクセント色に | 本日の日付を視覚的に強調 |
| `.calendar-table td.selected` | 背景色をアクセント色寄りに | 選択中の日付を視覚的に強調 |
| `.day-num.muted` | 文字色を淡色に | 投稿が存在しない日付をリンク不可・非強調として表現 |
| `.tag` | `text-decoration: none` | `<a>`要素として使用しているタグバッジからブラウザ標準の下線を除去するため |
| `.link-button` | `background: none`, `border: none`, `padding: 0` 等 | `<button>`要素（ログアウト）をナビゲーションの`<a>`リンクと見た目を揃えるため、ブラウザ標準のボタン装飾を除去 |

## 4. 入出力仕様

- 入力: なし（静的ファイル）
- 出力: 各画面のHTML要素に適用されるスタイル

## 5. 特記事項・留意点

- レスポンシブ対応（メディアクエリ）は本バージョンでは未実装。`.container`の`max-width: 780px`により、PC・スマートフォンともに単一カラムで概ね崩れなく表示されるが、狭幅端末での最適化が必要な場合は別途メディアクエリの追加を検討すること。
- ダークモード等のテーマ切り替えは未実装。色はすべて`:root`のカスタムプロパティ経由で参照しているため、将来的なテーマ追加時はこれらの変数の再定義で対応可能な構成となっている。
