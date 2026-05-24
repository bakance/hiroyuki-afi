# GitHub Secrets / 完全クラウド運用手順

この運用では `.env` を使いません。APIキーはGitHub Secretsにだけ入力します。

## GitHub Secretsを開く

以下を開きます。

```text
Settings > Secrets and variables > Actions > New repository secret
```

直接URL:

```text
https://github.com/bakance/hiroyuki-afi/settings/secrets/actions
```

## 最初に登録するSecrets

ウォームアップ投稿だけならSecretは不要です。

Google Sheetsで管理したい場合だけ、以下を登録します。

```text
GOOGLE_SHEETS_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
```

Amazon / 楽天の商品収集を始める段階で追加します。

```text
AMAZON_PARTNER_TAG
AMAZON_CREATORS_API_SEARCH_URL
AMAZON_CREATORS_API_TOKEN
RAKUTEN_APPLICATION_ID
RAKUTEN_ACCESS_KEY
RAKUTEN_AFFILIATE_ID
```

自動投稿に切り替える段階で追加します。

```text
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_SECRET
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_USER_ID
THREADS_ACCESS_TOKEN
THREADS_USER_ID
```

初期の自動投稿では、まず以下だけで開始できます。

```text
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_SECRET
THREADS_ACCESS_TOKEN
THREADS_USER_ID
```

XはOAuth 1.0aで投稿します。X Developerで発行する以下4つを、それぞれ別Secretとして登録してください。

```text
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_SECRET
```

Xで以下のエラーが出た場合は、Secretの名前ではなくX Developer App側の権限設定が原因です。

```text
Your client app is not configured with the appropriate oauth1 app permissions for this endpoint.
```

対応手順:

1. X Developer Portalで対象Appを開く
2. User authentication settings を開く
3. OAuth 1.0a / User context を有効にする
4. App permissions を Read and write にする
5. Save する
6. Access Token と Access Token Secret を再生成する
7. GitHub Secrets の `X_ACCESS_TOKEN` と `X_ACCESS_SECRET` を新しい値に差し替える
8. `Actions > Secret Diagnose` を実行する
9. `Actions > Auto Warmup Post` を `dry_run=false` で再実行する

重要: 権限変更前に作ったAccess Tokenは、Read and writeに自動更新されません。必ず再生成してください。

Pinterest / Instagram は画像URLが必要です。自動投稿する場合は以下も必要です。

```text
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_USER_ID
```

Repository variables に以下を入れます。

```text
AUTO_PUBLISH_PLATFORMS=x,threads
WARMUP_START_DATE=2026-05-24
```

Pinterest / Instagram も自動化する場合だけ、公開HTTPS画像URLを入れます。

```text
AUTO_PUBLISH_PLATFORMS=x,threads,pinterest,instagram
WARMUP_MEDIA_URL=https://...
META_API_VERSION=v24.0
```

## 初期ワークフロー

最初に使うのは以下です。

```text
Actions > Warmup Draft Generator > Run workflow
```

`start_date` に日本時間の開始日を入れます。

例:

```text
2026-05-22
```

実行後、`warmup-manual-posts` というArtifactが生成されます。中の `manual-posts.md` を開き、投稿本文をコピーして各SNSに手動投稿してください。

## 自動投稿ワークフロー

自動投稿は以下です。

```text
Actions > Auto Warmup Post
```

スケジュール:

- 08:20 JST
- 17:40 JST
- 21:15 JST

標準対象:

```text
X / Threads
```

Pinterest / Instagram は、画像投稿が前提なので `WARMUP_MEDIA_URL` を設定した場合だけ有効化します。

## 接続診断

Secretを登録した後、以下を実行します。

```text
Actions > Secret Diagnose > Run workflow
```

出力は `configured` / `missing` だけです。Secretの値は表示しません。

## ログに出してはいけないもの

以下はチャット、ログ、スクリーンショットに出さないでください。

- APIキー
- アクセストークン
- Secretの値
- Google private key
- OAuth refresh token
