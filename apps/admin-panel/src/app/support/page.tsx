'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { support, type Ticket, type TicketListResponse } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';

const statusFilters = ['all', 'open', 'in_progress', 'resolved', 'closed'];

const priorityVariant: Record<string, 'gray' | 'info' | 'warning' | 'danger'> = {
  low: 'gray',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const statusVariant: Record<string, 'warning' | 'info' | 'success' | 'gray'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'gray',
};

export default function SupportPage() {
  const [data, setData] = useState<TicketListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const fetchTickets = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status !== 'all') params.set('status', status);
    support.listTickets(params.toString())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const columns: Column<Ticket>[] = [
    {
      header: 'Subject',
      accessor: 'subject',
      sortable: true,
      render: (_, row) => (
        <Link href={`/support/${row.id}`} className="font-medium text-brand-600 hover:underline">
          {row.subject}
        </Link>
      ),
    },
    {
      header: 'User',
      accessor: 'userName',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="text-gray-700">{row.userName}</p>
          <p className="text-xs text-gray-400">{row.userEmail}</p>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (_, row) => (
        <Badge variant={priorityVariant[row.priority] ?? 'gray'}>{row.priority}</Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (_, row) => (
        <Badge variant={statusVariant[row.status] ?? 'gray'}>{row.status.replace('_', ' ')}</Badge>
      ),
    },
    {
      header: 'Messages',
      accessor: 'messages',
      render: (_, row) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {row.messages.length}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      sortable: true,
      render: (_, row) => (
        <span className="text-gray-500">{new Date(row.createdAt).toLocaleDateString('en-IN')}</span>
      ),
    },
    {
      header: 'Updated',
      accessor: 'updatedAt',
      sortable: true,
      render: (_, row) => (
        <span className="text-gray-500">{new Date(row.updatedAt).toLocaleDateString('en-IN')}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.total} total tickets` : 'Loading...'}
          </p>
        </div>
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
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.tickets ?? []}
        keyField="id"
        loading={loading}
        searchable
        searchPlaceholder="Search tickets..."
        pageSize={20}
        onRowClick={(row) => { window.location.href = `/support/${row.id}`; }}
      />
    </div>
  );
}
