# views/calendar.ejs 仕様書

## 改訂履歴

| 版数 | 改訂日 | 改訂者 | 改訂内容 |
|---|---|---|---|
| 1.0 | 2026-08-19 | システム | 新規作成 |

## 1. 概要

| 項目 | 内容 |
|---|---|
| ファイルパス | `views/calendar.ejs` |
| 役割 | カレンダー画面（SCR-05）。月別カレンダーの表示と、日付選択による当該日の記事一覧表示を行う |
| 描画元ルート | `GET /calendar`（`server.js`） |

## 2. 位置づけ・依存関係

- `partials/header.ejs`, `partials/footer.ejs`をインクルード
- `app.locals.formatDate()`を使用
- カレンダーの日付セルは`GET /calendar?year=...&month=...&date=...`への自己リンク

## 3. 詳細仕様

### 3.1 受け取る変数

| 変数名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `year` | number | ○ | 表示対象年 |
| `month` | number | ○ | 表示対象月（1〜12） |
| `weeks` | Array<Array<Cell\|null>> | ○ | 週単位の日付セル配列。`Cell = {day, dateStr, count}` |
| `prevYear`, `prevMonth` | number | ○ | 前月リンク用の年月 |
| `nextYear`, `nextMonth` | number | ○ | 翌月リンク用の年月 |
| `selectedDate` | string | ○ | 選択中の日付（`YYYY-MM-DD`）。未選択時は空文字 |
| `selectedPosts` | Post[] | ○ | `selectedDate`に投稿された記事一覧 |
| `commentCounts` | Object | ○ | `{postId:件数}`のマップ（`selectedPosts`表示用） |
| `todayStr` | string | ○ | 本日の日付文字列（`YYYY-MM-DD`）。本日セルの強調表示判定に使用 |

### 3.2 描画ロジック

1. ヘッダーへ`pageTitle: 'カレンダー'`を渡してインクルード
2. カレンダーナビ：前月リンク（`prevYear`/`prevMonth`）、「`year`年 `month`月」表示、翌月リンク（`nextYear`/`nextMonth`）
3. `<table class="calendar-table">`
   - 曜日ヘッダー行（日〜土、日曜・土曜は色分けクラス`sun`/`sat`）
   - `weeks`を`forEach`し、各週の7セルを`forEach`
     - `cell`が`null`：空セル（`empty-cell`）
     - `cell.count > 0`：`day-num`と`post-count`（📄件数）を`/calendar?year=&month=&date=`へのリンクとして表示。`today`/`selected`クラスを`dateStr`の一致判定で付与
     - `cell.count === 0`：リンクなし、`day-num muted`で日付のみ表示
4. `selectedDate`が真の場合、`<section class="calendar-selected">`
   - 見出し「`selectedDate` の投稿」
   - `selectedPosts.length === 0`：「この日の投稿はありません。」
   - それ以外：`post-card`形式で各記事（タイトルリンク、投稿日時、投稿者、コメント数）を一覧表示

## 4. 入出力仕様

- 入力: 上記変数群（サーバー側で組み立て済み）
- 出力: HTML全体
- 画面内リンク: `/calendar?year=&month=` （月送り）, `/calendar?year=&month=&date=`（日付選択）

## 5. 特記事項・留意点

- カレンダーグリッドの生成ロジック（週の折り返し・空白セルの算出）は本テンプレートではなく`server.js`の`GET /calendar`ハンドラ側で行っており、本テンプレートは受け取った`weeks`をそのまま表描画するのみである。ロジック変更時は`server.js`側の該当ルートも参照すること。
- 投稿が存在する日付のみリンクとして機能し、0件の日付はクリック不可（`<a>`タグを出力しない）仕様である。
