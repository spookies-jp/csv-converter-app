module.exports = {
  reactStrictMode: true,
  // GitHub Pages用の設定
  assetPrefix: process.env.NODE_ENV === 'production' ? '/csv-converter-app' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/csv-converter-app' : '',
  // Next.js 13+との互換性のために追加
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}
