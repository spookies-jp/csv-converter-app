import { useState, useEffect } from 'react';

export const useStringReplacement = () => {
  const [replacementRules, setReplacementRules] = useState([]);
  const [error, setError] = useState('');

  // LocalStorageからの読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem('csvConverter_replacementRules');
      if (saved) {
        const rules = JSON.parse(saved);
        setReplacementRules(rules);
      }
    } catch (err) {
      console.error('Failed to load replacement rules:', err);
      setError('置換ルールの読み込みに失敗しました');
    }
  }, []);

  // LocalStorageへの保存
  const saveRules = (rules) => {
    try {
      localStorage.setItem('csvConverter_replacementRules', JSON.stringify(rules));
      setReplacementRules(rules);
      setError('');
    } catch (err) {
      console.error('Failed to save replacement rules:', err);
      setError('置換ルールの保存に失敗しました');
    }
  };

  // バリデーション関数
  const validateRule = (searchText, replaceText, excludeId = null) => {
    if (!searchText || searchText.trim() === '') {
      return '検索する文字列を入力してください';
    }

    // 重複チェック
    const isDuplicate = replacementRules.some(rule => 
      rule.id !== excludeId && rule.searchText === searchText
    );
    if (isDuplicate) {
      return '同じ検索文字列が既に存在します';
    }

    return null;
  };

  // ルールの追加
  const addRule = (searchText, replaceText) => {
    const validationError = validateRule(searchText, replaceText);
    if (validationError) {
      setError(validationError);
      return false;
    }

    const newRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      searchText: searchText.trim(),
      replaceText: replaceText || '',
      isEnabled: true,
      order: replacementRules.length
    };

    const newRules = [...replacementRules, newRule];
    saveRules(newRules);
    return true;
  };

  // ルールの更新
  const updateRule = (id, searchText, replaceText) => {
    const validationError = validateRule(searchText, replaceText, id);
    if (validationError) {
      setError(validationError);
      return false;
    }

    const newRules = replacementRules.map(rule =>
      rule.id === id
        ? { ...rule, searchText: searchText.trim(), replaceText: replaceText || '' }
        : rule
    );
    saveRules(newRules);
    return true;
  };

  // ルールの削除
  const deleteRule = (id) => {
    const newRules = replacementRules.filter(rule => rule.id !== id);
    // 削除後の並び順を調整
    const reorderedRules = newRules.map((rule, index) => ({
      ...rule,
      order: index
    }));
    saveRules(reorderedRules);
  };

  // ルールの有効/無効切り替え
  const toggleRule = (id) => {
    const newRules = replacementRules.map(rule =>
      rule.id === id ? { ...rule, isEnabled: !rule.isEnabled } : rule
    );
    saveRules(newRules);
  };

  // 全てのルールの有効/無効切り替え
  const toggleAllRules = (enabled) => {
    const newRules = replacementRules.map(rule => ({
      ...rule,
      isEnabled: enabled
    }));
    saveRules(newRules);
  };

  // ルールの並び順変更
  const reorderRules = (fromIndex, toIndex) => {
    const newRules = [...replacementRules];
    const [reorderedRule] = newRules.splice(fromIndex, 1);
    newRules.splice(toIndex, 0, reorderedRule);
    
    // 並び順を更新
    const reorderedRules = newRules.map((rule, index) => ({
      ...rule,
      order: index
    }));
    saveRules(reorderedRules);
  };

  // 全ルールの削除
  const clearAllRules = () => {
    saveRules([]);
  };

  // 置換処理の適用
  const applyReplacements = (content) => {
    if (!content || replacementRules.length === 0) {
      return { processedContent: content, stats: { totalReplacements: 0, appliedRules: [] } };
    }

    let processedContent = content;
    const stats = { totalReplacements: 0, appliedRules: [] };

    // 有効なルールのみを順番に適用
    const enabledRules = replacementRules
      .filter(rule => rule.isEnabled)
      .sort((a, b) => a.order - b.order);

    for (const rule of enabledRules) {
      try {
        const beforeCount = (processedContent.match(new RegExp(escapeRegExp(rule.searchText), 'g')) || []).length;
        if (beforeCount > 0) {
          processedContent = processedContent.replace(
            new RegExp(escapeRegExp(rule.searchText), 'g'),
            rule.replaceText
          );
          stats.totalReplacements += beforeCount;
          stats.appliedRules.push({
            searchText: rule.searchText,
            replaceText: rule.replaceText,
            count: beforeCount
          });
        }
      } catch (err) {
        console.error('Error applying replacement rule:', err);
      }
    }

    return { processedContent, stats };
  };

  // 正規表現のエスケープ関数
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // エラーのクリア
  const clearError = () => {
    setError('');
  };

  return {
    replacementRules,
    error,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    toggleAllRules,
    reorderRules,
    clearAllRules,
    applyReplacements,
    clearError
  };
}; 