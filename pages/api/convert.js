import jschardet from 'jschardet';
import iconv from 'iconv-lite';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ファイル名をヘッダーから取得
    const fileName = req.headers['x-file-name'] ? 
      decodeURIComponent(req.headers['x-file-name']) : 
      'unknown.csv';

    // リクエストからバイナリデータを取得
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 文字コードを検出
    const detected = jschardet.detect(buffer);
    console.log(`Detected encoding for ${fileName}: ${detected.encoding} with confidence ${detected.confidence}`);
    
    if (!detected || detected.confidence < 0.6) {
      return res.status(400).json({ error: `Unable to detect file encoding for ${fileName}` });
    }

    // 既にUTF-8の場合のフラグを設定
    const isAlreadyUtf8 = detected.encoding.toLowerCase() === 'utf-8' || 
                           detected.encoding.toLowerCase() === 'ascii';

    // UTF-8に変換（すでにUTF-8の場合はそのまま）
    const content = iconv.decode(buffer, detected.encoding);
    
    return res.status(200).json({ 
      content, 
      originalEncoding: detected.encoding,
      isAlreadyUtf8
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return res.status(500).json({ error: 'Error processing file' });
  }
}
