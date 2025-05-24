# CSV文字コード変換アプリ

CSV ファイルを UTF-8 に変換するための Web アプリケーションです。

## WSL2 + Docker での実行方法

### 開発環境

開発環境では、ソースコードの変更を即座に反映させながら開発できます。

```bash
# アプリケーションの起動
docker-compose up

# バックグラウンドで起動する場合
docker-compose up -d

# コンテナの停止
docker-compose down
```

アプリケーションは http://localhost:3000 でアクセスできます。

### 本番環境

本番環境用のビルドと実行を行います。

```bash
# 本番用イメージをビルドして起動
docker-compose -f docker-compose.prod.yml up --build -d

# コンテナの停止
docker-compose -f docker-compose.prod.yml down
```

## GitHub Pages へのデプロイ

GitHub Pages にデプロイするには、次のコマンドを実行します：

```bash
# 静的ファイルを生成
docker-compose -f docker-compose.prod.yml run --rm app npm run deploy

# 生成された out ディレクトリの内容を GitHub Pages にデプロイ
# (GitHub Actions で自動的に行われます)
```

## 主な機能

- CSVファイルの文字コードを検出
- UTF-8 に自動変換
- 変換後のファイルのダウンロード
