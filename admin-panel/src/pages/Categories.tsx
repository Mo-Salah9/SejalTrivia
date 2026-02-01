import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Question {
  id: string;
  text: string;
  textAr: string;
  isSolved: boolean;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  enabled?: boolean;
  imageUrl?: string;
  questions: Question[];
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{ categoryId: string; question: Question | null }>({ categoryId: '', question: null });
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategories = async () => {
    // Safety check: prevent saving empty array
    if (categories.length === 0) {
      alert('⚠️ Cannot save: No categories to save. This would delete all data.');
      return;
    }

    // Confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to save ${categories.length} categories?\n\nThis will update all categories in the database.`
    );
    if (!confirmed) return;

    try {
      await apiService.saveCategories(categories);
      alert('Categories saved successfully!');
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save categories');
    }
  };

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: 'New Category',
      nameAr: 'فئة جديدة',
      enabled: true,
      imageUrl: '',
      questions: []
    };
    setEditingCategory(newCategory);
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;

    const index = categories.findIndex(c => c.id === editingCategory.id);
    if (index >= 0) {
      const updated = [...categories];
      updated[index] = editingCategory;
      setCategories(updated);
    } else {
      setCategories([...categories, editingCategory]);
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(c => c.id !== categoryId));
    }
  };

  const handleAddQuestion = (categoryId: string) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      text: '',
      textAr: '',
      isSolved: false
    };
    setEditingQuestion({ categoryId, question: newQuestion });
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion.question || !editingQuestion.categoryId) return;

    const categoryIndex = categories.findIndex(c => c.id === editingQuestion.categoryId);
    if (categoryIndex < 0) return;

    const updated = [...categories];
    const category = { ...updated[categoryIndex] };
    const questionIndex = category.questions.findIndex(q => q.id === editingQuestion.question!.id);

    if (questionIndex >= 0) {
      category.questions[questionIndex] = editingQuestion.question;
    } else {
      category.questions = [...category.questions, editingQuestion.question];
    }

    updated[categoryIndex] = category;
    setCategories(updated);
    setEditingQuestion({ categoryId: '', question: null });
  };

  const handleDeleteQuestion = (categoryId: string, questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updated = categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            questions: cat.questions.filter(q => q.id !== questionId)
          };
        }
        return cat;
      });
      setCategories(updated);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>
          Categories & Questions
        </h2>
        <div className="flex gap-2">
          <button onClick={loadCategories} className="btn btn-secondary">
            🔄 Refresh
          </button>
          <button onClick={handleAddCategory} className="btn btn-success">
            ➕ Add Category
          </button>
          <button onClick={handleSaveCategories} className="btn btn-primary">
            💾 Save All
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-3">{error}</div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {categories.map((category) => (
          <div key={category.id} className="card">
            <div className="flex-between mb-3">
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '0.25rem' }}>
                  {category.name}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  {category.nameAr} • {category.questions.length} questions
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpandedCategoryId(expandedCategoryId === category.id ? null : category.id)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {expandedCategoryId === category.id ? '▼ Collapse' : '▶ Expand'}
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={category.enabled !== false}
                    onChange={(e) => {
                      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, enabled: e.target.checked } : c));
                    }}
                  />
                  Show
                </label>
                <button
                  onClick={() => setEditingCategory({ ...category })}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="btn btn-danger"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            {expandedCategoryId === category.id ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <button
                    onClick={() => handleAddQuestion(category.id)}
                    className="btn btn-success"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    ➕ Add Question
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {category.questions.map((question, idx) => (
                    <div
                      key={question.id}
                      style={{
                        background: '#0f172a',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #334155'
                      }}
                    >
                      <div className="flex-between">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#f1f5f9' }}>
                            {idx + 1}. {question.text}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                            {question.textAr}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingQuestion({ categoryId: category.id, question: { ...question } })}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(category.id, question.id)}
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Click <strong style={{ color: '#e2e8f0' }}>Expand</strong> to view questions.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Category</h3>
              <button className="modal-close" onClick={() => setEditingCategory(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Show in game</label>
                <input
                  type="checkbox"
                  checked={editingCategory.enabled !== false}
                  onChange={(e) => setEditingCategory({ ...editingCategory, enabled: e.target.checked })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={editingCategory.imageUrl || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Name (English)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Name (Arabic)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingCategory.nameAr}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nameAr: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditingCategory(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveCategory} className="btn btn-success">
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion.question && (
        <div className="modal-overlay" onClick={() => setEditingQuestion({ categoryId: '', question: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Question</h3>
              <button className="modal-close" onClick={() => setEditingQuestion({ categoryId: '', question: null })}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Question (English)</label>
                <textarea
                  className="form-textarea"
                  value={editingQuestion.question.text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question!, text: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Question (Arabic)</label>
                <textarea
                  className="form-textarea"
                  value={editingQuestion.question.textAr}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question!, textAr: e.target.value }
                  })}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditingQuestion({ categoryId: '', question: null })} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveQuestion} className="btn btn-success">
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
