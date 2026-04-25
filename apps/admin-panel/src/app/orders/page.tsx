'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { orders, type Order, type OrderListResponse } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const statusFilters = ['all', 'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

const columns: Column<Order>[] = [
  {
    header: 'Order #',
    accessor: 'orderNumber',
    sortable: true,
    render: (_, row) => (
      <Link href={`/orders/${row.id}`} className="font-medium text-brand-600 hover:underline">
        {row.orderNumber}
      </Link>
    ),
  },
  {
    header: 'Customer',
    accessor: 'userName',
    sortable: true,
    render: (_, row) => <span className="text-gray-700">{row.userName}</span>,
  },
  {
    header: 'Vendor',
    accessor: 'vendorName',
    render: (_, row) => <span className="text-gray-700">{row.vendorName}</span>,
  },
  {
    header: 'Amount',
    accessor: 'total',
    sortable: true,
    render: (_, row) => <span className="font-medium text-gray-900">{formatCurrency(row.total)}</span>,
  },
  {
    header: 'Payment',
    accessor: 'paymentStatus',
    render: (_, row) => (
      <Badge variant={row.paymentStatus === 'paid' ? 'success' : 'warning'}>{row.paymentStatus}</Badge>
    ),
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (_, row) => (
      <Badge variant={statusVariant[row.status] ?? 'gray'}>{row.status}</Badge>
    ),
  },
  {
    header: 'Date',
    accessor: 'createdAt',
    sortable: true,
    render: (_, row) => (
      <span className="text-gray-500">{new Date(row.createdAt).toLocaleDateString('en-IN')}</span>
    ),
  },
];

export default function OrdersPage() {
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status !== 'all') params.set('status', status);
    orders.list(params.toString())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.total} total orders` : 'Loading...'}
          </p>
        </div>
        <button className="btn-secondary text-sm">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Export
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-50 p-1">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium capitalize transition-all ${
              status === s
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.orders ?? []}
        keyField="id"
        loading={loading}
        searchable
        searchPlaceholder="Search orders..."
        pageSize={20}
        onRowClick={(row) => { window.location.href = `/orders/${row.id}`; }}
      />
    </div>
  );
}
