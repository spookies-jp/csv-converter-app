import { useState } from 'react';
import styles from './StringReplacement.module.css';

export const StringReplacement = ({ 
  replacementRules, 
  error,
  onAddRule, 
  onUpdateRule, 
  onDeleteRule, 
  onToggleRule,
  onToggleAllRules,
  onReorderRules,
  onClearAllRules,
  onClearError
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const handleAddRule = () => {
    setShowAddForm(true);
    setEditingRule(null);
    onClearError();
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowAddForm(false);
    onClearError();
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
    setShowAddForm(false);
    onClearError();
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      onReorderRules(index, index - 1);
    }
  };

  const handleMoveDown = (index) => {
    if (index < replacementRules.length - 1) {
      onReorderRules(index, index + 1);
    }
  };

  const enabledRulesCount = replacementRules.filter(rule => rule.isEnabled).length;
  const hasRules = replacementRules.length > 0;

  return (
    <div className={styles.replacementSection}>
      <div className={styles.header}>
        <h3 className={styles.title}>文字列置換設定</h3>
        {hasRules && (
          <div className={styles.summary}>
            {enabledRulesCount} / {replacementRules.length} ルールが有効
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={onClearError} className={styles.errorClose}>×</button>
        </div>
      )}

      {/* 置換ルール一覧 */}
      {hasRules && (
        <div className={styles.rulesList}>
          <div className={styles.rulesHeader}>
            <span>置換ルール（上から順に適用）</span>
            <div className={styles.bulkActions}>
              <button 
                onClick={() => onToggleAllRules(true)}
                className={styles.bulkButton}
                disabled={enabledRulesCount === replacementRules.length}
              >
                全て有効
              </button>
              <button 
                onClick={() => onToggleAllRules(false)}
                className={styles.bulkButton}
                disabled={enabledRulesCount === 0}
              >
                全て無効
              </button>
              <button 
                onClick={onClearAllRules}
                className={styles.bulkButtonDanger}
              >
                全て削除
              </button>
            </div>
          </div>
          
          {replacementRules.map((rule, index) => (
            <RuleItem 
              key={rule.id}
              rule={rule}
              index={index}
              isFirst={index === 0}
              isLast={index === replacementRules.length - 1}
              isEditing={editingRule?.id === rule.id}
              onEdit={handleEditRule}
              onUpdate={onUpdateRule}
              onDelete={onDeleteRule}
              onToggle={onToggleRule}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onCancelEdit={handleCancelEdit}
            />
          ))}
        </div>
      )}

      {/* 置換設定が空の場合の表示 */}
      {!hasRules && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h4>文字列置換ルールが設定されていません</h4>
          <p>CSVファイルの文字列を置換するルールを追加してください</p>
        </div>
      )}

      {/* 新しいルール追加フォーム */}
      {showAddForm && (
        <AddRuleForm 
          onAdd={onAddRule}
          onCancel={handleCancelEdit}
        />
      )}

      {/* 追加ボタン */}
      {!showAddForm && !editingRule && (
        <button 
          onClick={handleAddRule}
          className={styles.addButton}
        >
          + 新しい置換ルールを追加
        </button>
      )}
    </div>
  );
};

// 個別のルールアイテムコンポーネント
const RuleItem = ({ 
  rule, 
  index, 
  isFirst, 
  isLast, 
  isEditing, 
  onEdit, 
  onUpdate, 
  onDelete, 
  onToggle, 
  onMoveUp, 
  onMoveDown, 
  onCancelEdit 
}) => {
  if (isEditing) {
    return (
      <EditRuleForm 
        rule={rule}
        onUpdate={onUpdate}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <div className={`${styles.ruleItem} ${!rule.isEnabled ? styles.disabled : ''}`}>
      <div className={styles.ruleContent}>
        <div className={styles.ruleOrder}>
          {index + 1}
        </div>
        <div className={styles.ruleText}>
          <div className={styles.searchText}>
            <strong>検索:</strong> "{rule.searchText}"
          </div>
          <div className={styles.replaceText}>
            <strong>置換:</strong> "{rule.replaceText || '(削除)'}"
          </div>
        </div>
        <div className={styles.ruleActions}>
          <button
            onClick={() => onToggle(rule.id)}
            className={`${styles.toggleButton} ${rule.isEnabled ? styles.enabled : styles.disabled}`}
          >
            {rule.isEnabled ? '有効' : '無効'}
          </button>
          <button
            onClick={() => onEdit(rule)}
            className={styles.editButton}
          >
            編集
          </button>
          <div className={styles.moveButtons}>
            <button
              onClick={() => onMoveUp(index)}
              disabled={isFirst}
              className={styles.moveButton}
            >
              ↑
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={isLast}
              className={styles.moveButton}
            >
              ↓
            </button>
          </div>
          <button
            onClick={() => onDelete(rule.id)}
            className={styles.deleteButton}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

// 新しいルール追加フォーム
const AddRuleForm = ({ onAdd, onCancel }) => {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onAdd(searchText, replaceText)) {
      setSearchText('');
      setReplaceText('');
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.ruleForm}>
      <h4>新しい置換ルールを追加</h4>
      <div className={styles.formGroup}>
        <label htmlFor="searchText">検索する文字列 *</label>
        <input
          id="searchText"
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="置換したい文字列を入力"
          className={styles.input}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="replaceText">置換後の文字列</label>
        <input
          id="replaceText"
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="置換後の文字列を入力（空の場合は削除）"
          className={styles.input}
        />
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton}>
          追加
        </button>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          キャンセル
        </button>
      </div>
    </form>
  );
};

// ルール編集フォーム
const EditRuleForm = ({ rule, onUpdate, onCancel }) => {
  const [searchText, setSearchText] = useState(rule.searchText);
  const [replaceText, setReplaceText] = useState(rule.replaceText);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onUpdate(rule.id, searchText, replaceText)) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.ruleForm}>
      <h4>置換ルールを編集</h4>
      <div className={styles.formGroup}>
        <label htmlFor="editSearchText">検索する文字列 *</label>
        <input
          id="editSearchText"
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="置換したい文字列を入力"
          className={styles.input}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="editReplaceText">置換後の文字列</label>
        <input
          id="editReplaceText"
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="置換後の文字列を入力（空の場合は削除）"
          className={styles.input}
        />
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton}>
          更新
        </button>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          キャンセル
        </button>
      </div>
    </form>
  );
}; 