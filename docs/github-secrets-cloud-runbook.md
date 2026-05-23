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
X_OAUTH2_ACCESS_TOKEN
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_USER_ID
THREADS_ACCESS_TOKEN
THREADS_USER_ID
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
