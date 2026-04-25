'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { vendors, type Vendor, type VendorListResponse } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const statusFilters = ['all', 'pending', 'approved', 'suspended'];

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
  pending: 'warning',
  approved: 'success',
  suspended: 'danger',
  rejected: 'danger',
};

export default function VendorsPage() {
  const [data, setData] = useState<VendorListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const fetchVendors = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status !== 'all') params.set('status', status);
    vendors.list(params.toString())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleApprove = async (id: string) => {
    try { await vendors.approve(id); fetchVendors(); } catch {}
  };

  const handleReject = async (id: string) => {
    try { await vendors.reject(id); fetchVendors(); } catch {}
  };

  const columns: Column<Vendor>[] = [
    {
      header: 'Business',
      accessor: 'businessName',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
            {row.businessName.charAt(0)}
          </div>
          <div>
            <Link href={`/vendors/${row.id}`} className="font-medium text-gray-900 hover:text-brand-600">
              {row.businessName}
            </Link>
            <p className="text-xs text-gray-400">{row.email ?? row.phoneNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'KYC Status',
      accessor: 'kycStatus',
      render: (_, row) => {
        const kycVariant: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
          not_submitted: 'gray',
          submitted: 'warning',
          verified: 'success',
          rejected: 'danger',
        };
        return <Badge variant={kycVariant[row.kycStatus] ?? 'gray'}>{row.kycStatus?.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      header: 'Orders',
      accessor: 'totalOrders',
      sortable: true,
      render: (_, row) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {row.totalOrders}
        </span>
      ),
    },
    {
      header: 'Earnings',
      accessor: 'totalEarnings',
      sortable: true,
      render: (_, row) => <span className="font-medium text-gray-900">{formatCurrency(row.totalEarnings)}</span>,
    },
    {
      header: 'Rating',
      accessor: 'averageRating',
      sortable: true,
      render: (_, row) => (
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          <span className="text-sm font-medium text-gray-700">{Number(row.averageRating).toFixed(1)}</span>
        </span>
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
      header: 'Joined',
      accessor: 'createdAt',
      sortable: true,
      render: (_, row) => (
        <span className="text-gray-500">{new Date(row.createdAt).toLocaleDateString('en-IN')}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleApprove(row.id); }}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
              >
                Approve
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleReject(row.id); }}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Reject
              </button>
            </>
          )}
          <Link href={`/vendors/${row.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-800" onClick={(e) => e.stopPropagation()}>
            View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.total} total vendors` : 'Loading...'}
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
            {s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyField="id"
        loading={loading}
        searchable
        searchPlaceholder="Search vendors..."
        pageSize={20}
        onRowClick={(row) => { window.location.href = `/vendors/${row.id}`; }}
      />
    </div>
  );
}
