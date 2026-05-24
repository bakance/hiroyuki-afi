# hiroyuki-afi

完全クラウド運用のSNSアフィリエイト準備リポジトリです。

## 現在のフェーズ

- アフィリエイトリンクなし
- X / Threads の自動ウォームアップ投稿に対応
- 1日3回のウォームアップ投稿をGitHub Actionsで実行
- 手動投稿用の投稿文生成も利用可能
- Pinterest / Instagram は画像URL設定後に有効化

## 最初に使うもの

自動投稿前の確認には、GitHubの `Actions` から以下を実行します。

```text
Warmup Draft Generator > Run workflow
```

生成後、Artifactの `warmup-manual-posts` を開き、`manual-posts.md` の投稿文を使います。

自動投稿は以下を実行します。

```text
Auto Warmup Post > Run workflow
```

最初は `dry_run=true` で確認し、問題なければ `dry_run=false` で実投稿します。

XでOAuth 1.0a権限エラーが出た場合は、X Developer Appを `Read and write` に変更し、Access Token / Access Token Secretを再生成してください。詳しくは `docs/github-secrets-cloud-runbook.md` を確認してください。

## 投稿文章ルール

現在の投稿文章ルールは以下です。

```text
docs/content-rules.md
```

投稿前に文章だけ確認したい場合は、`Auto Warmup Post` を `dry_run=true` で実行します。

## 運用資料

```text
docs/profile-pack.md
docs/api-checklist.md
docs/operation-and-monetization-plan.md
docs/github-secrets-cloud-runbook.md
```

## Secretについて

APIキーやSecret値は、このリポジトリの `Settings > Secrets and variables > Actions` にだけ入力します。
チャット、README、Issue、ログには貼らないでください。
