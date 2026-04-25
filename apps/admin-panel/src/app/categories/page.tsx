'use client';

import { useState, useEffect, useCallback } from 'react';
import { categories as categoriesApi, uploadToCloudinary, type Category } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesApi.list();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filtered = statusFilter === 'all'
    ? categories
    : categories.filter((c) => (statusFilter === 'active' ? c.isActive : !c.isActive));

  const openCreate = () => {
    setEditCategory(null);
    setFormName('');
    setFormDescription('');
    setFormImageUrl('');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormImageUrl(cat.imageUrl || '');
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      setError(null);
      const res = await uploadToCloudinary(file, 'category_banner');
      setFormImageUrl(res.secureUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (editCategory) {
        await categoriesApi.update(editCategory.id, { name: formName, description: formDescription, imageUrl: formImageUrl });
      } else {
        await categoriesApi.create({ name: formName, description: formDescription, imageUrl: formImageUrl });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await categoriesApi.delete(id);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const columns: Column<Category>[] = [
    {
      header: 'Order',
      accessor: 'sortOrder',
      sortable: true,
      render: (_, row) => <span className="text-gray-400 font-medium">#{row.sortOrder}</span>,
    },
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">/{row.slug}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (_, row) => (
        <Badge variant={row.isActive ? 'success' : 'gray'}>{row.isActive ? 'active' : 'inactive'}</Badge>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm text-gray-500">{new Date(row.createdAt).toLocaleDateString('en-IN')}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="text-xs font-medium text-brand-600 hover:text-brand-800"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            className="text-xs font-medium text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const statusFilters: { label: string; value: typeof statusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'Loading...' : `${categories.length} categories total`}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Category
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
              statusFilter === f.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} keyField="id" loading={loading} searchable searchPlaceholder="Search categories..." />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editCategory ? 'Edit Category' : 'Create Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              id="cat-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label htmlFor="cat-desc" className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="cat-desc"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="input"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category Image</label>
            <div className="flex items-center gap-4">
              {formImageUrl && (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                  <img src={formImageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                {uploadingImage && <p className="mt-1 text-xs text-brand-600">Uploading...</p>}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : editCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
