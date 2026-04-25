'use client';

import { useState, useEffect, useCallback } from 'react';
import { promotions, type Coupon, type CouponListResponse, type CreateCouponPayload } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const emptyCoupon: CreateCouponPayload = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderValue: 0,
  maxDiscount: 0,
  usageLimit: 0,
  expiresAt: '',
};

export default function PromotionsPage() {
  const [data, setData] = useState<CouponListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateCouponPayload>(emptyCoupon);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'expired'>('all');

  const fetchCoupons = useCallback(() => {
    setLoading(true);
    promotions.list()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await promotions.create(form);
      setShowModal(false);
      setForm(emptyCoupon);
      fetchCoupons();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await promotions.deactivate(id);
      fetchCoupons();
    } catch {
      // handled silently
    }
  };

  const filteredCoupons = (data?.coupons ?? []).filter((c) => {
    if (activeFilter === 'active') return c.isActive;
    if (activeFilter === 'expired') return !c.isActive;
    return true;
  });

  const columns: Column<Coupon>[] = [
    {
      header: 'Code',
      accessor: 'code',
      sortable: true,
      render: (_, row) => (
        <span className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-sm font-semibold text-gray-900">{row.code}</span>
      ),
    },
    {
      header: 'Discount',
      accessor: 'discountValue',
      sortable: true,
      render: (_, row) => (
        <div>
          <span className="font-medium text-gray-900">
            {row.discountType === 'percentage' ? `${row.discountValue}%` : formatCurrency(row.discountValue)}
          </span>
          {row.maxDiscount > 0 && (
            <p className="text-xs text-gray-400">max {formatCurrency(row.maxDiscount)}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Min Order',
      accessor: 'minOrderValue',
      sortable: true,
      render: (_, row) => <span className="text-gray-600">{formatCurrency(row.minOrderValue)}</span>,
    },
    {
      header: 'Usage',
      accessor: 'usedCount',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-brand-500"
              style={{ width: `${Math.min(100, (row.usedCount / row.usageLimit) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{row.usedCount}/{row.usageLimit}</span>
        </div>
      ),
    },
    {
      header: 'Expires',
      accessor: 'expiresAt',
      sortable: true,
      render: (_, row) => (
        <span className="text-gray-500">{new Date(row.expiresAt).toLocaleDateString('en-IN')}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (_, row) => (
        <Badge variant={row.isActive ? 'success' : 'gray'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        row.isActive ? (
          <button
            onClick={(e) => { e.stopPropagation(); handleDeactivate(row.id); }}
            className="text-xs font-medium text-red-500 hover:text-red-700"
          >
            Deactivate
          </button>
        ) : null
      ),
    },
  ];

  const filterTabs: { label: string; value: typeof activeFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Expired', value: 'expired' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage coupons and discount codes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Create Coupon
        </button>
      </div>

      <div className="flex gap-2">
        {filterTabs.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
              activeFilter === f.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredCoupons}
        keyField="id"
        loading={loading}
        searchable
        searchPlaceholder="Search coupons..."
      />

      {/* Create Coupon Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setError(''); }} title="Create Coupon" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-code" className="mb-1 block text-sm font-medium text-gray-700">Code</label>
              <input id="c-code" type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input" required placeholder="e.g. SUMMER20" />
            </div>
            <div>
              <label htmlFor="c-type" className="mb-1 block text-sm font-medium text-gray-700">Discount Type</label>
              <select id="c-type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })} className="input">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label htmlFor="c-val" className="mb-1 block text-sm font-medium text-gray-700">
                Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input id="c-val" type="number" value={form.discountValue || ''} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="input" required min={0} />
            </div>
            <div>
              <label htmlFor="c-min" className="mb-1 block text-sm font-medium text-gray-700">Min Order Value (₹)</label>
              <input id="c-min" type="number" value={form.minOrderValue || ''} onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })} className="input" min={0} />
            </div>
            <div>
              <label htmlFor="c-max" className="mb-1 block text-sm font-medium text-gray-700">Max Discount (₹)</label>
              <input id="c-max" type="number" value={form.maxDiscount || ''} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} className="input" min={0} />
            </div>
            <div>
              <label htmlFor="c-limit" className="mb-1 block text-sm font-medium text-gray-700">Usage Limit</label>
              <input id="c-limit" type="number" value={form.usageLimit || ''} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} className="input" min={0} />
            </div>
            <div>
              <label htmlFor="c-exp" className="mb-1 block text-sm font-medium text-gray-700">Expires At</label>
              <input id="c-exp" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="input" required />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="c-desc" className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea id="c-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[60px] resize-y" placeholder="Describe the promotion..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
