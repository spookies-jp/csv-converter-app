#!/bin/bash

echo "=== 権限の修正を開始 ==="

# .nextディレクトリが存在する場合は削除
if [ -d ".next" ]; then
  echo "既存の.nextディレクトリを削除しています..."
  rm -rf .next
fi

# node_modulesディレクトリが存在する場合は削除
if [ -d "node_modules" ]; then
  echo "既存のnode_modulesディレクトリを削除しています..."
  rm -rf node_modules
fi

# Dockerコンテナを停止して再ビルド
echo "Dockerコンテナを再ビルドしています..."
docker-compose down
docker-compose build --no-cache

echo "=== 権限の修正が完了しました ==="
echo "次のコマンドを実行してアプリケーションを起動してください："
echo "docker-compose up"
