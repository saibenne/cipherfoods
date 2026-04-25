'use client';

import { useState, useEffect } from 'react';
import { config, categories, products, type PlatformConfig, type HomeSlide, type Category } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformConfig | null>(null);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      config.get(),
      categories.list().catch(() => []),
      products.list({ limit: '100' }).catch(() => ({ items: [] }))
    ])
      .then(([cfg, cats, prods]) => {
        setSettings(cfg);
        setCategoriesList(cats);
        setProductsList(prods.items || []);
      })
      .catch((e) => setError(e.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await config.update(settings);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!settings) {
    return <div className="card text-center text-red-600">{error || 'Failed to load settings'}</div>;
  }

  const updateField = <K extends keyof PlatformConfig>(key: K, value: PlatformConfig[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingVideo(true);
      setError('');
      const { uploadToCloudinary } = await import('@/lib/api');
      const res = await uploadToCloudinary(file, 'category_banner', 'video');
      updateField('heroVideoUrl', res.secureUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAddSlide = () => {
    const newSlide: HomeSlide = { id: crypto.randomUUID(), imageUrl: '', type: 'category', targetId: '' };
    updateField('homeSlideshow', [...(settings?.homeSlideshow || []), newSlide]);
  };

  const handleUpdateSlide = (index: number, field: keyof HomeSlide, value: string) => {
    if (!settings?.homeSlideshow) return;
    const newSlides = [...settings.homeSlideshow];
    newSlides[index] = { ...newSlides[index], [field]: value };
    updateField('homeSlideshow', newSlides);
  };

  const handleRemoveSlide = (index: number) => {
    if (!settings?.homeSlideshow) return;
    const newSlides = settings.homeSlideshow.filter((_, i) => i !== index);
    updateField('homeSlideshow', newSlides);
  };

  const handleSlideImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingSlideIndex(index);
      setError('');
      const { uploadToCloudinary } = await import('@/lib/api');
      const res = await uploadToCloudinary(file, 'category_banner', 'image');
      handleUpdateSlide(index, 'imageUrl', res.secureUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure platform-wide settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">Settings saved successfully!</div>}

        {/* General */}
        <div className="card">
          <h2 className="font-display mb-4 text-lg font-semibold">General</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateField('platformName', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateField('supportEmail', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Support Phone</label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => updateField('supportPhone', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Commission */}
        <div className="card">
          <h2 className="font-display mb-4 text-lg font-semibold">Commission</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Commission Rate (%)</label>
              <input
                type="number"
                value={settings.commissionRate}
                onChange={(e) => updateField('commissionRate', Number(e.target.value))}
                className="input"
                min={0}
                max={100}
                step={0.1}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Min Order Value (₹)</label>
              <input
                type="number"
                value={settings.minOrderValue}
                onChange={(e) => updateField('minOrderValue', Number(e.target.value))}
                className="input"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="card">
          <h2 className="font-display mb-4 text-lg font-semibold">Delivery</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Base Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings.deliveryFeeBase}
                onChange={(e) => updateField('deliveryFeeBase', Number(e.target.value))}
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Per Km Fee (₹)</label>
              <input
                type="number"
                value={settings.deliveryFeePerKm}
                onChange={(e) => updateField('deliveryFeePerKm', Number(e.target.value))}
                className="input"
                min={0}
                step={0.5}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Free Delivery Threshold (₹)</label>
              <input
                type="number"
                value={settings.freeDeliveryThreshold}
                onChange={(e) => updateField('freeDeliveryThreshold', Number(e.target.value))}
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Delivery Radius (km)</label>
              <input
                type="number"
                value={settings.maxDeliveryRadius}
                onChange={(e) => updateField('maxDeliveryRadius', Number(e.target.value))}
                className="input"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Hero Media */}
        <div className="card">
          <h2 className="font-display mb-4 text-lg font-semibold">Hero Media</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Hero Background Video URL</label>
              <input
                type="url"
                value={settings.heroVideoUrl || ''}
                onChange={(e) => updateField('heroVideoUrl', e.target.value)}
                className="input mb-3"
                placeholder="https://res.cloudinary.com/.../video.mp4"
              />
              <div className="flex items-center gap-4">
                <label className="btn-secondary cursor-pointer relative overflow-hidden">
                  {uploadingVideo ? 'Uploading...' : 'Upload Video to Cloudinary'}
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleVideoUpload}
                    disabled={uploadingVideo}
                  />
                </label>
              </div>
            </div>
            {settings.heroVideoUrl && (
               <div className="mt-4 rounded-xl overflow-hidden max-w-sm border border-gray-200">
                 <video src={settings.heroVideoUrl} controls className="w-full" muted />
               </div>
            )}
          </div>
        </div>

        {/* Home Slideshow */}
        <div className="card">
          <h2 className="font-display mb-4 text-lg font-semibold">Home Slideshow</h2>
          <div className="space-y-4">
            {(settings.homeSlideshow || []).map((slide, index) => (
              <div key={slide.id} className="p-4 border rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center relative">
                <button type="button" onClick={() => handleRemoveSlide(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="w-32 h-24 shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs">No Image</span>
                  )}
                </div>
                <div className="flex-1 space-y-3 w-full pr-6">
                  <div className="flex items-center gap-4">
                    <label className="btn-secondary cursor-pointer relative overflow-hidden text-sm py-1.5 px-3">
                      {uploadingSlideIndex === index ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleSlideImageUpload(index, e)} disabled={uploadingSlideIndex === index} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Link Type</label>
                      <select className="input text-sm py-1.5" value={slide.type} onChange={(e) => handleUpdateSlide(index, 'type', e.target.value)}>
                        <option value="category">Category</option>
                        <option value="product">Product</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Target</label>
                      <select className="input text-sm py-1.5" value={slide.targetId} onChange={(e) => handleUpdateSlide(index, 'targetId', e.target.value)}>
                        <option value="">Select target</option>
                        {slide.type === 'category' ? categoriesList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        )) : productsList.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={handleAddSlide} className="btn-secondary w-full border-dashed">
              + Add Slide
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
