'use client';

import { useEffect, useState } from 'react';
import { inventory, formatDate } from '@/lib/api';
import type { InventoryItem } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

type Tab = 'all' | 'low-stock' | 'expiring';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [batchModal, setBatchModal] = useState(false);
  const [batchUpdates, setBatchUpdates] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      let data: InventoryItem[];
      switch (tab) {
        case 'low-stock':
          data = await inventory.getLowStock();
          break;
        case 'expiring':
          data = await inventory.getExpiring();
          break;
        default:
          data = await inventory.getAll();
      }
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStock(productId: string) {
    try {
      await inventory.update(productId, { stock: editStock });
      setEditingId(null);
      loadData();
    } catch {
      alert('Failed to update stock');
    }
  }

  async function handleBatchUpdate() {
    try {
      const entries = Object.entries(batchUpdates);
      for (const [productId, stock] of entries) {
        await inventory.update(productId, { stock });
      }
      setBatchModal(false);
      setBatchUpdates({});
      loadData();
    } catch {
      alert('Some updates failed');
    }
  }

  const lowStockCount = items.filter((i) => i.isLowStock).length;
  const expiringCount = items.filter((i) => i.isExpiring).length;

  const TABS: { key: Tab; label: string; count?: number; color?: string }[] = [
    { key: 'all', label: 'All Items' },
    { key: 'low-stock', label: 'Low Stock', count: lowStockCount, color: 'text-amber-600' },
    { key: 'expiring', label: 'Expiring Soon', count: expiringCount, color: 'text-red-600' },
  ];

  function stockPercent(item: InventoryItem) {
    const max = Math.max(item.stock, item.lowStockThreshold * 4, 100);
    return Math.min(100, (item.stock / max) * 100);
  }

  function stockColor(item: InventoryItem) {
    if (item.stock === 0) return 'bg-red-500';
    if (item.isLowStock) return 'bg-amber-400';
    return 'bg-emerald-500';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">Monitor and manage your stock levels</p>
        </div>
        <button onClick={() => { setBatchUpdates({}); setBatchModal(true); }} className="btn-primary inline-flex items-center gap-1.5 text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Batch Update
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100">
            <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total SKUs</p>
            <p className="text-xl font-bold text-gray-900">{items.length}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/60 flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Low Stock</p>
            <p className="text-xl font-bold text-amber-600">{lowStockCount}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Expiring Soon</p>
            <p className="text-xl font-bold text-red-600">{expiringCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`ml-1.5 text-xs font-semibold ${t.color}`}>({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} columns={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === 'low-stock' ? 'No low stock items' : tab === 'expiring' ? 'No items expiring soon' : 'No inventory items'}
          description="Your inventory looks good!"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100/60 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 font-medium text-gray-600">Stock Level</th>
                <th className="hidden px-4 py-3 font-medium text-gray-600 sm:table-cell">Threshold</th>
                <th className="hidden px-4 py-3 font-medium text-gray-600 md:table-cell">Expiry</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className={`transition-colors hover:bg-gray-50/50 ${item.isLowStock ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{item.product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        min="0"
                        value={editStock}
                        onChange={(e) => setEditStock(Number(e.target.value))}
                        className="input-field w-24"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-20 rounded-full bg-gray-100">
                          <div
                            className={`h-2 rounded-full transition-all ${stockColor(item)}`}
                            style={{ width: `${stockPercent(item)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${item.isLowStock ? 'text-amber-600' : item.stock === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.stock}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{item.lowStockThreshold}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {item.expiryDate ? (
                      <span className={item.isExpiring ? 'font-medium text-red-600' : 'text-gray-500'}>
                        {formatDate(item.expiryDate)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.stock === 0 && <Badge variant="danger">Out of Stock</Badge>}
                      {item.stock > 0 && item.isLowStock && <Badge variant="warning">Low</Badge>}
                      {item.isExpiring && <Badge variant="danger">Expiring</Badge>}
                      {!item.isLowStock && !item.isExpiring && item.stock > 0 && <Badge variant="success">OK</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === item.id ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleUpdateStock(item.product.id)}
                          className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(item.id); setEditStock(item.stock); }}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title="Update stock"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Batch Update Modal */}
      <Modal isOpen={batchModal} onClose={() => setBatchModal(false)} title="Batch Stock Update" size="lg">
        <p className="mb-4 text-sm text-gray-500">Update stock levels for multiple products at once.</p>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No items to update</p>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {items.slice(0, 20).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-2">
                  {item.isLowStock && (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{item.product.name}</span>
                  <span className="text-xs text-gray-400">Current: {item.stock}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder={String(item.stock)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBatchUpdates((prev) => {
                      if (!e.target.value) {
                        const next = { ...prev };
                        delete next[item.product.id];
                        return next;
                      }
                      return { ...prev, [item.product.id]: val };
                    });
                  }}
                  className="input-field w-24 text-right"
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setBatchModal(false)} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={handleBatchUpdate}
            disabled={Object.keys(batchUpdates).length === 0}
            className="btn-primary text-sm disabled:opacity-50"
          >
            Update {Object.keys(batchUpdates).length} item{Object.keys(batchUpdates).length !== 1 ? 's' : ''}
          </button>
        </div>
      </Modal>
    </div>
  );
}
