#!/bin/bash

echo "=== Docker 環境の完全クリーンアップと再ビルド ==="

# Dockerコンテナを停止して削除
echo "Dockerコンテナを停止しています..."
docker-compose down

# Dockerイメージを削除
echo "Dockerイメージを削除しています..."
docker rmi $(docker images -q csv-converter-app_app) 2>/dev/null || true

# Dockerボリュームを削除
echo "Dockerボリュームをクリーンアップしています..."
docker volume prune -f

# Docker キャッシュをクリア
echo "Dockerビルドキャッシュをクリアしています..."
docker builder prune -f

# アプリケーションを再ビルド
echo "アプリケーションを再ビルドしています..."
docker-compose build --no-cache

echo "=== クリーンアップと再ビルドが完了しました ==="
echo "次のコマンドを実行してアプリケーションを起動してください："
echo "docker-compose up"
