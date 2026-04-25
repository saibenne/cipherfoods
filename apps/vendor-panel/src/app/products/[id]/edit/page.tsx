'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { catalog, uploadToCloudinary } from '@/lib/api';
import type { Category, ProductFormData, Product, Variant } from '@/lib/api';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stockQuantity, setStockQuantity] = useState(0);

  const [form, setForm] = useState<ProductFormData>({
    name: '',
    description: '',
    basePrice: 0,
    images: [],
    categoryId: '',
    variants: [],
    unit: 'kg',
  });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, cats] = await Promise.all([
          catalog.getProduct(id),
          catalog.getCategories(),
        ]);
        setProduct(p);
        setCategories(cats);

        // Initialize stock quantity from existing variants
        const hasDefaultVariant = p.variants?.length === 1 && p.variants[0].name === 'Default';
        if (hasDefaultVariant) {
          setStockQuantity(p.variants![0].stockQuantity || 0);
        } else if (p.variants && p.variants.length > 0) {
          setStockQuantity(p.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0));
        }

        setForm({
          name: p.name,
          description: p.description,
          basePrice: p.basePrice,
          salePrice: p.salePrice,
          images: p.images,
          categoryId: p.category?.id || '',
          variants: p.variants?.map(({ name, sku, price, salePrice, weight, unit, stockQuantity }) => ({ name, sku, price, salePrice, weight, unit, stockQuantity })),
          unit: p.unit,
          weight: p.weight,
          isFeatured: p.isFeatured,
        });
        setIsActive(p.isActive);
      } catch {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addVariant() {
    updateField('variants', [...(form.variants || []), { name: '', sku: '', price: 0, stockQuantity: 0 }]);
  }

  function updateVariant(index: number, field: keyof Omit<Variant, 'id'>, value: string | number) {
    const variants = [...(form.variants || [])];
    variants[index] = { ...variants[index], [field]: value };
    updateField('variants', variants);
  }

  function removeVariant(index: number) {
    updateField('variants', (form.variants || []).filter((_, i) => i !== index));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadToCloudinary(file, 'product_image');
      updateField('images', [...form.images, { url: result.url, publicId: result.publicId }]);
    } catch {
      setError('Failed to upload image');
    }
  }

  function removeImage(index: number) {
    updateField('images', form.images.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const submitData = { ...form };

      const hasCustomVariants = submitData.variants && submitData.variants.length > 0 &&
        !(submitData.variants.length === 1 && submitData.variants[0].name === 'Default');

      if (stockQuantity > 0 && !hasCustomVariants) {
        submitData.variants = [{
          name: 'Default',
          sku: `${form.name.substring(0, 3).toUpperCase()}-DEF`,
          price: form.basePrice,
          stockQuantity,
        }];
      }

      await catalog.updateProduct(id, submitData);
      router.push('/products');
    } catch (err) {
      setError((err as { message?: string })?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!product && error) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-red-600">{error}</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500">Update &quot;{product?.name}&quot;</p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Basic info */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Product Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="input-field min-h-[100px] resize-y"
                required
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pricing & Stock</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Base Price (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.basePrice || ''}
                onChange={(e) => updateField('basePrice', Number(e.target.value))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Sale Price (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.salePrice || ''}
                onChange={(e) => updateField('salePrice', Number(e.target.value) || undefined)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                className="input-field"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
                <option value="pack">pack</option>
                <option value="dozen">dozen</option>
              </select>
            </div>
            <div>
              <label className="label">Stock Quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stockQuantity || ''}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="input-field"
                placeholder="Available stock"
                readOnly={!!(form.variants && form.variants.length > 0 && !(form.variants.length === 1 && form.variants[0].name === 'Default'))}
              />
              {form.variants && form.variants.length > 1 && (
                <p className="mt-1 text-xs text-gray-400">Total stock across all variants (read-only)</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">Product is active</span>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Images</h2>
          <div className="mb-4 flex flex-wrap gap-3">
            {form.images.map((img, i) => (
              <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-brand-500 hover:text-brand-700">
            <span>+ Upload Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Variants */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Variants</h2>
            <button type="button" onClick={addVariant} className="text-sm font-medium text-brand-700 hover:text-brand-800">
              + Add Variant
            </button>
          </div>
          {(!form.variants || form.variants.length === 0) ? (
            <p className="text-sm text-gray-400">No variants added.</p>
          ) : (
            <div className="space-y-3">
              {form.variants.map((v, i) => (
                <div key={i} className="flex items-end gap-3 rounded-lg border border-gray-100 p-3">
                  <div className="flex-1">
                    <label className="label">Name</label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariant(i, 'name', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="w-28">
                    <label className="label">SKU</label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="w-28">
                    <label className="label">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={v.price || ''}
                      onChange={(e) => updateVariant(i, 'price', Number(e.target.value))}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <label className="label">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={v.stockQuantity || ''}
                      onChange={(e) => updateVariant(i, 'stockQuantity', Number(e.target.value))}
                      className="input-field"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="mb-0.5 rounded p-2 text-red-500 hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
