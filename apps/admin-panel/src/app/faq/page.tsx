'use client';

import { useState, useEffect, useCallback } from 'react';
import { faq as faqApi, type FAQ, type CreateFAQPayload } from '@/lib/api';

const emptyFAQ: CreateFAQPayload = { question: '', answer: '', category: '', order: 0 };

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateFAQPayload>(emptyFAQ);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchFAQs = useCallback(() => {
    setLoading(true);
    faqApi.list()
      .then(setFaqs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const resetForm = () => {
    setForm(emptyFAQ);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await faqApi.update(editingId, form);
      } else {
        await faqApi.create(form);
      }
      resetForm();
      fetchFAQs();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to save FAQ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: FAQ) => {
    setForm({ question: item.question, answer: item.answer, category: item.category, order: item.order });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await faqApi.delete(id);
      fetchFAQs();
    } catch {
      // handled silently
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => { showForm ? resetForm() : setShowForm(true); }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add FAQ'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-display text-lg font-semibold">{editingId ? 'Edit FAQ' : 'New FAQ'}</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
              <input
                type="text"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="input"
                required
                placeholder="e.g. How do I track my order?"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Answer</label>
              <textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                className="input min-h-[100px] resize-y"
                required
                placeholder="Provide a detailed answer..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
                required
                placeholder="e.g. Orders, Payments, Delivery"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Display Order</label>
              <input
                type="number"
                value={form.order || ''}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="input"
                min={0}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingId ? 'Update FAQ' : 'Create FAQ'}
            </button>
          </div>
        </form>
      )}

      {/* FAQ list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="card text-center text-gray-400">No FAQs found. Create your first one.</div>
      ) : (
        <div className="space-y-3">
          {faqs.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="badge-info">{item.category}</span>
                    <span className="text-xs text-gray-400">#{item.order}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.question}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{item.answer}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => handleEdit(item)} className="text-sm font-medium text-brand-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-sm font-medium text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
