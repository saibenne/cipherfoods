'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/StatsCard';
import Badge from '@/components/ui/Badge';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { delivery, formatDateTime } from '@/lib/api';
import type { DeliveryInfo } from '@/lib/api';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

type DeliveryStatus = 'all' | 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
  pending: 'warning',
  assigned: 'info',
  picked_up: 'info',
  in_transit: 'warning',
  delivered: 'success',
  failed: 'danger',
  cancelled: 'danger',
  returned: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const TABS: { key: DeliveryStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed', label: 'Failed' },
];

const columns: Column<DeliveryInfo>[] = [
  { header: 'Order', accessor: 'orderId', sortable: true, render: (row) => <span className="font-medium text-gray-900 font-mono text-xs">{row.orderId.slice(0, 8)}…</span> },
  { header: 'Status', accessor: 'status', render: (row) => <Badge variant={STATUS_BADGE[row.status] ?? 'info'}>{STATUS_LABELS[row.status] ?? row.status}</Badge> },
  { header: 'Carrier', accessor: 'carrier', render: (row) => <span className="text-gray-600">{row.carrier ?? '—'}</span>, className: 'hidden md:table-cell' },
  { header: 'Tracking', accessor: 'trackingNumber', render: (row) => <span className="font-mono text-xs text-gray-500">{row.trackingNumber ?? '—'}</span>, className: 'hidden lg:table-cell' },
  { header: 'ETA', accessor: 'estimatedDelivery', render: (row) => <span className="text-sm text-gray-500">{row.estimatedDelivery ?? '—'}</span> },
];

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<DeliveryStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    delivery.list()
      .then((res) => {
        const items = Array.isArray(res) ? res : (res as { items?: DeliveryInfo[] }).items ?? [];
        setDeliveries(items);
      })
      .catch((err) => setError(err.message || 'Failed to load deliveries'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Delivery Tracking</h1>
          <p className="text-sm text-gray-500">Monitor your order deliveries</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Delivery Tracking</h1>
          <p className="text-sm text-gray-500">Monitor your order deliveries</p>
        </div>
        <EmptyState title="Failed to load deliveries" description={error} />
      </div>
    );
  }

  const filtered = deliveries.filter((d) => {
    if (tab !== 'all' && d.status !== tab) return false;
    if (search && !d.orderId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const inTransit = deliveries.filter((d) => d.status === 'in_transit').length;
  const deliveredCount = deliveries.filter((d) => d.status === 'delivered').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Delivery Tracking</h1>
        <p className="text-sm text-gray-500">Monitor your order deliveries</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatsCard
          title="In Transit"
          value={inTransit}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          }
        />
        <StatsCard
          title="Delivered"
          value={deliveredCount}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Deliveries"
          value={deliveries.length}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        page={page}
        pageSize={20}
        total={filtered.length}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by order ID..."
        emptyTitle="No deliveries found"
        emptyDescription="No deliveries match the current filter."
      />
    </div>
  );
}
