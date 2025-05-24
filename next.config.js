module.exports = {
  reactStrictMode: true,
  // GitHub Pages用の設定
  assetPrefix: process.env.NODE_ENV === 'production' ? '/csv-converter-app/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/csv-converter-app' : '',
}
