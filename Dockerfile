FROM node:16-alpine

WORKDIR /app

# まず、ルートユーザーとしてディレクトリ構造を設定
# 必要なディレクトリを作成し、node ユーザーに所有権を付与
RUN mkdir -p /app/node_modules /app/.next && \
    chown -R node:node /app

# node ユーザーに切り替え
USER node

# 依存関係のインストール
COPY --chown=node:node package*.json ./
RUN npm install

# アプリケーションのコードをコピー
COPY --chown=node:node . .

# コンテナが適切に起動できるようにポートを露出
EXPOSE 3000

# デバッグを容易にするためにログ出力を増やす
ENV NODE_ENV=development
ENV DEBUG=*

# 開発環境とプロダクション環境で異なるコマンドを実行できるようにする
CMD ["npm", "run", "dev"]
