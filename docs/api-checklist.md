# API / 連携チェックリスト

現在の最小構成は、X と Threads の自動投稿まで確認済みです。次に必要なAPIは、商品取得、画像投稿、成果確認、将来の動画展開に分けて追加します。

## 現在連携済み

| 用途 | サービス | 状態 | GitHub Secrets / Variables |
| --- | --- | --- | --- |
| X投稿 | X API OAuth 1.0a | 実投稿確認済み | `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` |
| Threads投稿 | Threads API | 実投稿確認済み | `THREADS_ACCESS_TOKEN`, `THREADS_USER_ID` |
| 実行基盤 | GitHub Actions | 稼働中 | GitHub標準 |

## 次に必要

| 優先 | 用途 | サービス | 必要なもの | 備考 |
| --- | --- | --- | --- | --- |
| 高 | Pinterest投稿 | Pinterest API v5 | `PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_ID`, `WARMUP_MEDIA_URL` | 画像URL必須。Cloudflareに画像を置くと扱いやすい |
| 高 | Instagram投稿 | Instagram Graph API | `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, `WARMUP_MEDIA_URL` | 画像URL必須。Meta側の権限とアカウント種別確認が必要 |
| 高 | Amazon商品取得 | Amazon Product Advertising API または Creators API | `AMAZON_PARTNER_TAG`, APIキー類 | 商品名、価格、画像、URL取得に使用 |
| 高 | 楽天商品取得 | Rakuten Web Service | `RAKUTEN_APPLICATION_ID`, `RAKUTEN_AFFILIATE_ID` | 楽天市場の商品取得とアフィリエイトURL生成 |
| 中 | 画像ホスティング | Cloudflare R2 / Images | Cloudflare API Token, Account ID | Pinterest / Instagram投稿用の公開HTTPS画像URLを作る |
| 中 | 投稿管理 | Google Sheets API | `GOOGLE_SHEETS_ID`, service account | 商品候補、投稿予定、成果を低コストに管理 |
| 中 | 文章生成 | xAI / Grok API または OpenAI API | APIキー | 初期は固定テンプレート。次フェーズで導入 |
| 中 | 画像生成 | GPT Image / Nano Banana等 | APIキーまたは手動生成 | 商品写真と誤認されないネタ画像に限定 |
| 低 | TikTok展開 | TikTok Shop / TikTok for Developers | 審査、ショップ/アフィリエイト連携 | 初期最小構成には入れない。短尺動画化後に追加 |

## GitHub Variables

```text
AUTO_PUBLISH_PLATFORMS=x,threads
WARMUP_START_DATE=2026-05-24
META_API_VERSION=v24.0
WARMUP_MEDIA_URL=https://...
```

Pinterest / Instagramを入れる場合:

```text
AUTO_PUBLISH_PLATFORMS=x,threads,pinterest,instagram
```

## 追加順序

1. X / Threadsの1週間安定稼働
2. Pinterest / Instagramの画像URL投稿テスト
3. Cloudflareに画像置き場を作る
4. Amazon / 楽天の商品取得を入れる
5. Google Sheetsに商品候補と投稿履歴を保存する
6. 文章生成AIを入れる
7. 画像生成AIを入れる
8. 成果が出てからTikTok Shop / 動画生成へ拡張する

## 公式資料

- X Create Post API: https://docs.x.com/x-api/posts/create-post
- Threads API: https://developers.facebook.com/docs/threads/
- Instagram Graph API Content Publishing: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing/
- Pinterest API: https://developers.pinterest.com/docs/api/v5/
- Amazon Product Advertising API: https://webservices.amazon.com/paapi5/documentation/
- Rakuten Web Service: https://webservice.rakuten.co.jp/
- Cloudflare Workers Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Cloudflare R2: https://developers.cloudflare.com/r2/
