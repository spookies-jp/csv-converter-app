import { useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';

export default function Home() {
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const csvFiles = files.filter(file => file.name.endsWith('.csv'));
    if (csvFiles.length === 0) {
      setError('CSVファイルのみアップロードできます');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const results = [];

      for (const file of csvFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const detected = jschardet.detect(buffer);

        if (!detected || !detected.encoding || detected.confidence < 0.6) {
          throw new Error(`${file.name} の文字コードを特定できませんでした`);
        }

        const encoding = detected.encoding;
        const isAlreadyUtf8 = encoding.toLowerCase() === 'utf-8' || encoding.toLowerCase() === 'ascii';
        const decodedText = iconv.decode(buffer, encoding);
        const utf8WithBom = '\uFEFF' + decodedText;

        results.push({
          originalName: file.name,
          content: utf8WithBom,
          originalEncoding: encoding,
          isAlreadyUtf8
        });
      }

      setConvertedFiles(prevFiles => [...prevFiles, ...results]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error converting files:', err);
      setError('ファイルの変換中にエラーが発生しました: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index) => {
    setConvertedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const downloadFile = (content, fileName) => {
    if (!content) return;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `utf8-${fileName || 'converted.csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>CSV文字コード変換アプリ</title>
        <meta name="description" content="CSVファイルをUTF-8に変換するアプリ" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>CSV文字コード変換アプリ</h1>

        <p className={styles.description}>
          CSVファイルをUTF-8に変換します
        </p>

        <div className={styles.card}>
          <div className={styles.uploadContainer}>
            <label htmlFor="csvFile" className={styles.uploadButton}>
              CSVファイルを追加
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileUpload}
                className={styles.fileInput}
                multiple
                ref={fileInputRef}
              />
            </label>
            {convertedFiles.length > 0 && (
              <span className={styles.fileName}>{convertedFiles.length} ファイル</span>
            )}
          </div>

          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              変換処理中...
            </div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {convertedFiles.length > 0 && (
            <div className={styles.results}>
              <h3>変換済みファイル</h3>
              <div className={styles.fileList}>
                {convertedFiles.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <div className={styles.fileHeader}>
                      <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{file.originalName}</span>
                        <span className={styles.encoding}>
                          {file.isAlreadyUtf8
                            ? '既にUTF-8形式'
                            : `元の文字コード: ${file.originalEncoding}`}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className={styles.removeButton}
                        title="ファイルを削除"
                        aria-label="ファイルを削除"
                      >
                        ×
                      </button>
                    </div>
                    <button
                      onClick={() => downloadFile(file.content, file.originalName)}
                      className={styles.downloadButton}
                    >
                      {file.isAlreadyUtf8 ? 'ダウンロード' : 'UTF-8でダウンロード'}
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.actionBar}>
                <button
                  onClick={() => setConvertedFiles([])}
                  className={styles.clearAllButton}
                >
                  全てのファイルを削除
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>CSV文字コード変換アプリ © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
