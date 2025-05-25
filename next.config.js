const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  reactStrictMode: true,
  output: 'export',
  assetPrefix: isProd ? '/csv-converter-app/' : '',
  basePath: isProd ? '/csv-converter-app' : '',
  images: {
    unoptimized: true,
  },
};
