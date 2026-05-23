# hiroyuki-afi

完全クラウド運用のSNSアフィリエイト準備リポジトリです。

## 現在のフェーズ

- APIキー不要
- アフィリエイトリンクなし
- 自動投稿なし
- 1日3回のウォームアップ投稿文をGitHub Actionsで生成
- 投稿は手動でコピーして実行

## 最初に使うもの

GitHubの `Actions` から以下を実行します。

```text
Warmup Draft Generator > Run workflow
```

生成後、Artifactの `warmup-manual-posts` を開き、`manual-posts.md` の投稿文を使います。

## Secretについて

APIキーやSecret値は、このリポジトリの `Settings > Secrets and variables > Actions` にだけ入力します。
チャット、README、Issue、ログには貼らないでください。
