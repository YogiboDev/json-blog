# views/categories.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | #1: 新規作成（カテゴリー機能） |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/categories.ejs` |
| 役割 | カテゴリー一覧画面。登録済みの全カテゴリーを件数付きで一覧表示し、各カテゴリーの記事一覧へのリンクを提供する |
| 描画元ルート | `GET /categories`（`server.js`） |

## 2. 位置づけ・依存関係

- `partials/header.ejs`, `partials/footer.ejs`をインクルード
- 各カテゴリーへのリンクは`GET /categories/:category`（`index.ejs`を流用して描画）

## 3. 詳細仕様

### 3.1 受け取る変数

| 変数名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `categories` | `{ name: string, count: number }[]` | ○ | `db.getCategories()`の結果。件数降順、同数は名称昇順でソート済み |

### 3.2 描画ロジック

1. ヘッダーへ`pageTitle: 'カテゴリー'`を渡してインクルード
2. `<h1>`に「カテゴリー」を表示
3. `categories.length === 0`の場合：「まだカテゴリーがありません。」を`empty-state`クラスで表示
4. それ以外：`categories`を`forEach`し、`category-list-item`として以下を表示
   - カテゴリー名（`/categories/{encodeURIComponent(name)}`へのリンク）
   - 件数（`category-count`クラス）

## 4. 入出力仕様

- 入力: `categories`
- 出力: HTML全体
- 画面内リンク: `/categories/{カテゴリー名（URLエンコード済み）}`

## 5. 特記事項・留意点

- カテゴリー名はEJSの自動エスケープ出力（`<%= %>`）でXSS対策済み。リンク生成時は`encodeURIComponent`でURLエンコードしている。
- カテゴリーを持たない記事は`lib/db.js`側で`'未分類'`として集計されるため、本画面には常に少なくとも1件（未分類を含む）が表示され得る。
