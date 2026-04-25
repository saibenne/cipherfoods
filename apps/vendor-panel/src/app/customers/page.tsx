'use client';

import { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { customers, formatPrice, formatDate } from '@/lib/api';
import type { CustomerRow } from '@/lib/api';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

type Segment = 'all' | 'new' | 'repeat' | 'vip';

function getSegment(c: CustomerRow): 'new' | 'repeat' | 'vip' {
  if (c.totalOrders >= 15) return 'vip';
  if (c.totalOrders >= 3) return 'repeat';
  return 'new';
}

const SEGMENT_BADGE: Record<string, 'success' | 'info' | 'primary'> = {
  new: 'info',
  repeat: 'primary',
  vip: 'success',
};

const TABS: { key: Segment; label: string }[] = [
  { key: 'all', label: 'All Customers' },
  { key: 'new', label: 'New' },
  { key: 'repeat', label: 'Repeat' },
  { key: 'vip', label: 'VIP' },
];

const columns: Column<CustomerRow & { segment: string }>[] = [
  {
    header: 'Customer',
    accessor: 'name',
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900">{row.name}</p>
        {row.email && <p className="text-xs text-gray-500">{row.email}</p>}
      </div>
    ),
  },
  { header: 'Orders', accessor: 'totalOrders', sortable: true, render: (row) => <span className="font-medium">{row.totalOrders}</span> },
  {
    header: 'Total Spent',
    accessor: 'totalSpent',
    sortable: true,
    render: (row) => <span className="font-medium text-gray-900">{formatPrice(row.totalSpent)}</span>,
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Last Order',
    accessor: 'lastOrderDate',
    sortable: true,
    render: (row) => <span className="text-gray-500">{row.lastOrderDate ? formatDate(row.lastOrderDate) : '—'}</span>,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Tier',
    accessor: 'segment',
    render: (row) => <Badge variant={SEGMENT_BADGE[row.segment]}>{row.segment.toUpperCase()}</Badge>,
  },
];

export default function CustomersPage() {
  const [data, setData] = useState<(CustomerRow & { segment: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    customers.list()
      .then((rows) => {
        const items = Array.isArray(rows) ? rows : [];
        setData(items.map((c) => ({ ...c, segment: getSegment(c) })));
      })
      .catch((err) => setError(err.message || 'Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Customer Insights</h1>
          <p className="text-sm text-gray-500">Understand your customer base</p>
        </div>
        <SkeletonTable rows={6} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Customer Insights</h1>
          <p className="text-sm text-gray-500">Understand your customer base</p>
        </div>
        <EmptyState title="Failed to load customers" description={error} />
      </div>
    );
  }

  const filtered = data.filter((c) => {
    if (segment !== 'all' && c.segment !== segment) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const topCustomers = [...data].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Customer Insights</h1>
        <p className="text-sm text-gray-500">Understand your customer base</p>
      </div>

      {/* Top customers highlight */}
      {topCustomers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {topCustomers.map((c, i) => (
            <div key={c.userId} className="rounded-2xl bg-white border border-gray-100/60 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 p-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'
              }`}>
                #{i + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500">{c.totalOrders} orders · {formatPrice(c.totalSpent)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Segment filter */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setSegment(t.key); setPage(1); }}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              segment === t.key
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
        keyExtractor={(row) => row.userId}
        page={page}
        pageSize={20}
        total={filtered.length}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or email..."
        emptyTitle="No customers found"
        emptyDescription="No customers match the current filter."
      />
    </div>
  );
}
