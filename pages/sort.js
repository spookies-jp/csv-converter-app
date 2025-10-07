import { useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';

const QUESTION_COLUMN_PATTERNS = [
  { key: 'questionId', regex: /^質問ID(\d+)$/ },
  { key: 'questionTitle', regex: /^質問タイトル(\d+)$/ },
  { key: 'answerId', regex: /^回答ID(\d+)$/ },
  { key: 'answer', regex: /^回答(\d+)$/ }
];

const reorderQuestionGroupColumns = (csvContent) => {
  if (!csvContent) return csvContent;

  try {
    const hasBom = csvContent.startsWith('\uFEFF');
    const newline = csvContent.includes('\r\n') ? '\r\n' : '\n';
    const hasTrailingNewline = /(\r\n|\r|\n)$/.test(csvContent.replace(/^\uFEFF/, ''));
    const contentWithoutBom = hasBom ? csvContent.slice(1) : csvContent;
    const rows = parseCsvRows(contentWithoutBom);

    if (rows.length === 0) {
      return csvContent;
    }

    const header = rows[0];
    const groupMap = new Map();
    const questionIdColumns = [];
    const nonQuestionColumns = [];

    // ヘッダーから質問グループの列位置を特定
    header.forEach((headerName, index) => {
      const trimmed = headerName.trim();
      let isQuestionColumn = false;

      for (const pattern of QUESTION_COLUMN_PATTERNS) {
        const match = trimmed.match(pattern.regex);
        if (!match) continue;

        const [, number] = match;
        if (!groupMap.has(number)) {
          groupMap.set(number, {
            questionId: null,
            questionTitle: null,
            answerId: null,
            answer: null
          });
        }
        const group = groupMap.get(number);
        group[pattern.key] = index;

        if (pattern.key === 'questionId') {
          questionIdColumns.push({ number, index });
        }

        isQuestionColumn = true;
        break;
      }

      if (!isQuestionColumn) {
        nonQuestionColumns.push(index);
      }
    });

    if (groupMap.size === 0) {
      return csvContent;
    }

    // データ行を並び替え
    const reorderedRows = [header];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const newRow = new Array(header.length).fill('');

      // 質問グループ以外の列をコピー
      nonQuestionColumns.forEach(colIndex => {
        newRow[colIndex] = row[colIndex] || '';
      });

      // 質問IDとそのグループデータを抽出
      const questionGroups = [];
      groupMap.forEach((group) => {
        const questionIdValue = row[group.questionId] || '';
        if (questionIdValue) {
          questionGroups.push({
            questionIdValue: questionIdValue,
            questionId: row[group.questionId] || '',
            questionTitle: row[group.questionTitle] || '',
            answerId: row[group.answerId] || '',
            answer: row[group.answer] || ''
          });
        }
      });

      // 質問IDの値で昇順ソート
      questionGroups.sort((a, b) => {
        const aNum = parseInt(a.questionIdValue, 10);
        const bNum = parseInt(b.questionIdValue, 10);
        return aNum - bNum;
      });

      // ソート順に質問グループ列に配置
      questionIdColumns.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));

      questionGroups.forEach((qGroup, idx) => {
        if (idx < questionIdColumns.length) {
          const targetGroupNumber = questionIdColumns[idx].number;
          const targetGroup = groupMap.get(targetGroupNumber);

          if (targetGroup.questionId !== null) newRow[targetGroup.questionId] = qGroup.questionId;
          if (targetGroup.questionTitle !== null) newRow[targetGroup.questionTitle] = qGroup.questionTitle;
          if (targetGroup.answerId !== null) newRow[targetGroup.answerId] = qGroup.answerId;
          if (targetGroup.answer !== null) newRow[targetGroup.answer] = qGroup.answer;
        }
      });

      reorderedRows.push(newRow);
    }

    const rebuiltContent = stringifyCsvRows(reorderedRows, newline, hasTrailingNewline);
    return hasBom ? `\uFEFF${rebuiltContent}` : rebuiltContent;
  } catch (err) {
    console.error('Failed to reorder question group columns:', err);
    return csvContent;
  }
};

const parseCsvRows = (input) => {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (insideQuotes) {
      if (char === '"') {
        const nextChar = input[i + 1];
        if (nextChar === '"') {
          currentField += '"';
          i += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
      continue;
    }

    if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if (char === '\r' || char === '\n') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      if (char === '\r' && input[i + 1] === '\n') {
        i += 1;
      }
      continue;
    }

    currentField += char;
  }

  currentRow.push(currentField);
  rows.push(currentRow);

  // Remove trailing empty row that can occur when the file ends with a newline
  if (rows.length > 1) {
    const lastRow = rows[rows.length - 1];
    const isLastRowEmpty = lastRow.length === 1 && lastRow[0] === '';
    const inputEndsWithNewline = input.endsWith('\n') || input.endsWith('\r');
    if (isLastRowEmpty && inputEndsWithNewline) {
      rows.pop();
    }
  }

  return rows;
};

const stringifyCsvRows = (rows, newline, hasTrailingNewline) => {
  const serialized = rows
    .map((row) => row
      .map((field) => {
        const value = field ?? '';
        const needsQuotes = /[",\r\n]/.test(value);
        const escaped = value.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      })
      .join(','))
    .join(newline);

  return hasTrailingNewline ? `${serialized}${newline}` : serialized;
};
export default function SortPage() {
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
        let encoding = detected?.encoding?.toLowerCase() || '';
        // 英数字のみかチェック（＝文字コード特定しづらい）
        const asciiOnly = /^[\x00-\x7F]*$/.test(buffer.toString('binary'));
        // 不明 or 信頼度低 or 英数字のみ → shift_jis にフォールバック
        if (!encoding || detected.confidence < 0.2 || asciiOnly) {
          encoding = 'shift_jis';
        }
        const supportedEncodings = ['utf-8', 'ascii', 'shift_jis', 'windows-1252'];
        if (!supportedEncodings.includes(encoding)) {
          throw new Error(`${file.name} は未対応の文字コードです（推定: ${encoding}）`);
        }
        const isAlreadyUtf8 = encoding === 'utf-8' || encoding === 'ascii';
        const decodedText = iconv.decode(buffer, encoding);
        const utf8WithBom = '\uFEFF' + decodedText;
        results.push({
          originalName: file.name,
          content: utf8WithBom,
          originalEncoding: encoding,
          isAlreadyUtf8
        });
      }
      setConvertedFiles(prev => [...prev, ...results]);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

    // 質問グループの列順を整える
    const reorderedContent = reorderQuestionGroupColumns(content);

    const blob = new Blob([reorderedContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sorted-${fileName || 'converted.csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <div className={styles.container}>
      <Head>
        <title>CSV質問グループ並び替えアプリ</title>
        <meta name="description" content="CSVファイルの質問・回答を正しい順序に並び替えるアプリ" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>CSV質問グループ並び替えアプリ</h1>
        <p className={styles.description}>CSVファイルの質問・回答を正しい順序に並び替えます</p>
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
          {isLoading && <div className={styles.loading}>処理中...</div>}
          {error && <div className={styles.error}>{error}</div>}
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
                      <button onClick={() => removeFile(index)} className={styles.removeButton}>
                        ×
                      </button>
                    </div>
                    <button
                      onClick={() => downloadFile(file.content, file.originalName)}
                      className={styles.downloadButton}
                    >
                      並び替えてダウンロード
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.actionBar}>
                <button onClick={() => setConvertedFiles([])} className={styles.clearAllButton}>
                  全てのファイルを削除
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className={styles.footer}>
        <p>CSV質問グループ並び替えアプリ © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
