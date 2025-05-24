#!/bin/bash

echo "=== Docker コンテナログの確認 ==="
docker-compose logs app

echo "=== コンテナのステータス確認 ==="
docker-compose ps

echo "=== 実行中のコンテナに直接アクセス ==="
echo "以下のコマンドを実行してコンテナにアクセスできます："
echo "docker-compose run --rm app sh"

echo "=== 環境の確認 ==="
docker-compose run --rm app env

# ネットワークとポートのチェック
echo "=== ネットワークチェック ==="
docker-compose run --rm app sh -c "apk add --no-cache curl && curl -I http://localhost:3000 || echo 'ローカルホストへの接続に失敗しました'"
