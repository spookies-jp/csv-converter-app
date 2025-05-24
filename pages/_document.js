import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    const basePath = process.env.NODE_ENV === 'production' ? '/csv-converter-app' : '';
    
    return (
      <Html>
        <Head>
          <link rel="stylesheet" href={`${basePath}/styles/globals.css`} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
