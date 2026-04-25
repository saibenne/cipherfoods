'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { BarChart, DonutChart } from '@/components/ui/Chart';

// Mock product detail
const PRODUCT = {
  id: 'prod-001',
  name: 'Organic Turmeric Powder',
  sku: 'TUR-ORG-500',
  category: 'Spices',
  basePrice: 299,
  salePrice: 399,
  unit: '500g',
  status: 'active' as const,
  lowStockThreshold: 10,
  description:
    'Premium organic turmeric powder sourced from Erode, Tamil Nadu. Rich curcumin content with vibrant golden color.',
  images: [{ url: '/placeholder-product.jpg', publicId: 'placeholder' }],
  variants: [
    { sku: 'TUR-ORG-250', unit: '250g', price: 165, stockQuantity: 78 },
    { sku: 'TUR-ORG-500', unit: '500g', price: 299, stockQuantity: 42 },
    { sku: 'TUR-ORG-1KG', unit: '1kg', price: 549, stockQuantity: 18 },
  ],
  created: '2024-12-15',
  totalSold: 1284,
  avgRating: 4.6,
  totalReviews: 89,
  totalRevenue: 383916,
};

const PRODUCT_STOCK = PRODUCT.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

const DAILY_SALES = [
  { label: 'Mon', value: 12 },
  { label: 'Tue', value: 18 },
  { label: 'Wed', value: 9 },
  { label: 'Thu', value: 22 },
  { label: 'Fri', value: 15 },
  { label: 'Sat', value: 28 },
  { label: 'Sun', value: 20 },
];

const RATING_DIST = [
  { label: '5★', value: 45, color: '#16a34a' },
  { label: '4★', value: 24, color: '#22c55e' },
  { label: '3★', value: 12, color: '#facc15' },
  { label: '2★', value: 5, color: '#f97316' },
  { label: '1★', value: 3, color: '#ef4444' },
];

const RECENT_REVIEWS = [
  { id: 'r1', author: 'Priya Sharma', rating: 5, comment: 'Best turmeric I have ever used. Pure and aromatic.', date: '2 days ago' },
  { id: 'r2', author: 'Rajesh Iyer', rating: 4, comment: 'Good quality, delivery was fast. Slightly expensive.', date: '5 days ago' },
  { id: 'r3', author: 'Meena Krishnan', rating: 5, comment: 'Natural color, no adulteration. Will reorder!', date: '1 week ago' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'reviews'>('overview');

  const statusMap: Record<string, 'success' | 'warning' | 'gray'> = {
    active: 'success',
    draft: 'gray',
    out_of_stock: 'warning',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{PRODUCT.name}</h1>
              <Badge variant={statusMap[PRODUCT.status]}>{PRODUCT.status}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">SKU: {PRODUCT.sku} · {PRODUCT.unit} · {PRODUCT.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm">
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit Product
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Sold</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{PRODUCT.totalSold.toLocaleString()}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase">Revenue</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">₹{(PRODUCT.totalRevenue / 1000).toFixed(1)}k</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase">Rating</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{PRODUCT.avgRating}</p>
          <p className="text-xs text-gray-400">{PRODUCT.totalReviews} reviews</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase">In Stock</p>
          <p className={`mt-1 text-2xl font-bold ${PRODUCT_STOCK <= PRODUCT.lowStockThreshold ? 'text-red-600' : 'text-gray-900'}`}>
            {PRODUCT_STOCK}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Product tabs">
          {(['overview', 'sales', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Product Information</h3>
            <dl className="space-y-3">
              {[
                ['Product Name', PRODUCT.name],
                ['Category', PRODUCT.category],
                ['Price', `₹${PRODUCT.basePrice}`],
                ['MRP', `₹${PRODUCT.salePrice}`],
                ['Discount', `${Math.round(((PRODUCT.salePrice - PRODUCT.basePrice) / PRODUCT.salePrice) * 100)}%`],
                ['Created', PRODUCT.created],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
              <p className="mt-1 text-sm text-gray-700">{PRODUCT.description}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Variants &amp; Stock</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="pb-2">SKU</th>
                    <th className="pb-2">Unit</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCT.variants.map((v) => (
                    <tr key={v.sku} className="border-b border-gray-50">
                      <td className="py-2.5 font-mono text-xs text-gray-600">{v.sku}</td>
                      <td className="py-2.5">{v.unit}</td>
                      <td className="py-2.5 text-right font-medium">₹{v.price}</td>
                      <td className="py-2.5 text-right">
                        <span className={v.stockQuantity < 20 ? 'font-semibold text-red-600' : 'text-gray-900'}>{v.stockQuantity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="card lg:col-span-3">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Sales This Week</h3>
            <BarChart data={DAILY_SALES} height={220} />
          </div>
          <div className="card lg:col-span-2">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Rating Distribution</h3>
            <DonutChart data={RATING_DIST} size={160} />
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {RECENT_REVIEWS.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{r.author}</p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{r.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
