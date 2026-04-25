'use client';

import { useState, useEffect, useCallback } from 'react';
import { auditLogs, type AuditLog, type AuditLogListResponse } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';

const actionVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  approve: 'success',
  reject: 'danger',
  login: 'gray',
  suspend: 'warning',
};

const actionFilters = ['all', 'create', 'update', 'delete', 'approve', 'reject'];

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLogListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    auditLogs.list(params.toString())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = (data?.logs ?? []).filter((l) => {
    if (actionFilter === 'all') return true;
    return l.action.toLowerCase().includes(actionFilter);
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      sortable: true,
      render: (_, row) => (
        <span className="whitespace-nowrap text-gray-500">{new Date(row.createdAt).toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: 'Admin',
      accessor: 'adminName',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
            {row.adminName.charAt(0)}
          </div>
          <span className="font-medium text-gray-900">{row.adminName}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (_, row) => {
        const key = row.action.toLowerCase().split('_')[0];
        return <Badge variant={actionVariant[key] ?? 'info'}>{row.action}</Badge>;
      },
    },
    {
      header: 'Resource',
      accessor: 'resource',
      render: (_, row) => <span className="capitalize text-gray-600">{row.resource}</span>,
    },
    {
      header: 'Resource ID',
      accessor: 'resourceId',
      render: (_, row) => (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">{row.resourceId}</span>
      ),
    },
    {
      header: 'Details',
      accessor: 'details',
      render: (_, row) => (
        <span className="max-w-xs truncate text-gray-500" title={row.details}>{row.details}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">
          {data ? `${data.total} total entries` : 'Loading admin action history...'}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-50 p-1">
        {actionFilters.map((f) => (
          <button
            key={f}
            onClick={() => setActionFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium capitalize transition-all ${
              actionFilter === f
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        keyField="id"
        loading={loading}
        searchable
        searchPlaceholder="Search logs..."
        pageSize={30}
      />
    </div>
  );
}
