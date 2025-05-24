import { useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // ファイル追加処理
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // CSVファイルのみを選択
    const csvFiles = files.filter(file => file.name.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      setError('CSVファイルのみアップロードできます');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const results = [];
      
      // 各ファイルを順番に処理
      for (const file of csvFiles) {
        const buffer = await file.arrayBuffer();
        
        // サーバーレス関数に送信
        const response = await fetch('/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-File-Name': encodeURIComponent(file.name)
          },
          body: buffer,
        });
        
        if (!response.ok) {
          throw new Error(`${file.name}の変換中にエラーが発生しました`);
        }
        
        const data = await response.json();
        results.push({
          originalName: file.name,
          content: data.content,
          originalEncoding: data.originalEncoding,
          isAlreadyUtf8: data.isAlreadyUtf8
        });
      }
      
      // 既存のファイルと新しいファイルを結合
      setConvertedFiles(prevFiles => [...prevFiles, ...results]);
      
      // ファイル入力をリセットして、同じファイルを再選択できるようにする
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

  // ファイル削除機能
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
    URL.revokeObjectURL(url); // メモリリークを防止
  };

  // 重複ファイルのチェック
  const hasDuplicateFile = (fileName) => {
    return convertedFiles.some(file => file.originalName === fileName);
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.83301 14.1667H14.1663V5.83333H10.8163L9.16634 4.16667H5.83301V14.1667Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.33301 8.33333H11.6663" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 10V6.66667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6.66667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.99996 16.6667C13.6819 16.6667 16.6666 13.6819 16.6666 10C16.6666 6.31811 13.6819 3.33334 9.99996 3.33334C6.31807 3.33334 3.33329 6.31811 3.33329 10C3.33329 13.6819 6.31807 16.6667 9.99996 16.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
                            ? <span className={styles.alreadyUtf8}>
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M16.6667 5L7.50001 14.1667L3.33334 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                既にUTF-8形式
                              </span>
                            : `元の文字コード: ${file.originalEncoding}`
                          }
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
                      className={`${styles.downloadButton} ${file.isAlreadyUtf8 ? styles.downloadButtonUtf8 : ''}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 13.3333L10 3.33333" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.66669 10L10 13.3333L13.3334 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.33331 16.6667H16.6666" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {file.isAlreadyUtf8 
                        ? 'ダウンロード' 
                        : 'UTF-8でダウンロード'
                      }
                    </button>
                  </div>
                ))}
              </div>
              
              {convertedFiles.length > 0 && (
                <div className={styles.actionBar}>
                  <button 
                    onClick={() => setConvertedFiles([])}
                    className={styles.clearAllButton}
                  >
                    全てのファイルを削除
                  </button>
                </div>
              )}
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
