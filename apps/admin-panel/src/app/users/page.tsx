'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { users, type AdminManagedUser } from '@/lib/api';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';

const roleVariant: Record<string, 'primary' | 'info' | 'warning'> = {
  customer: 'info',
  vendor: 'primary',
  admin: 'warning',
};

const statusVariant: Record<string, 'success' | 'danger'> = {
  active: 'success',
  banned: 'danger',
};

const roleFilters = ['all', 'customer', 'vendor', 'admin'] as const;
const statusFilters = ['all', 'active', 'banned'] as const;

export default function UsersPage() {
  const router = useRouter();
  const [data, setData] = useState<{ items: AdminManagedUser[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(pageSize),
      };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const result = await users.list(params);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanToggle = async (user: AdminManagedUser) => {
    try {
      if (user.status === 'active') {
        await users.ban(user.id);
      } else {
        await users.unban(user.id);
      }
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  };

  const columns: Column<AdminManagedUser>[] = [
    {
      header: 'User',
      accessor: 'name',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{row.name}</p>
            <p className="truncate text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      render: (_, row) => <Badge variant={roleVariant[row.role] ?? 'gray'}>{row.role}</Badge>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (_, row) => <Badge variant={statusVariant[row.status] ?? 'gray'}>{row.status}</Badge>,
    },
    {
      header: 'Joined',
      accessor: 'createdAt',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/users/${row.id}`); }}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            View
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleBanToggle(row); }}
            className={`text-sm font-medium ${row.status === 'active' ? 'text-red-600 hover:underline' : 'text-emerald-600 hover:underline'}`}
          >
            {row.status === 'active' ? 'Ban' : 'Unban'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          {loading ? 'Loading users...' : `${data.total} total users on the platform`}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-gray-500">Role:</span>
          {roleFilters.map((f) => (
            <button
              key={f}
              onClick={() => { setRoleFilter(f); setPage(1); }}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                roleFilter === f ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-gray-500">Status:</span>
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                statusFilter === f ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data.items}
        total={data.total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or email..."
        onRowClick={(row) => router.push(`/users/${row.id}`)}
        keyExtractor={(row) => row.id}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your filters or search query."
      />
    </div>
  );
}
