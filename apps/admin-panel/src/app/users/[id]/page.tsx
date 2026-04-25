'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { users, type AdminManagedUser } from '@/lib/api';
import Badge from '@/components/ui/Badge';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  active: 'success', banned: 'danger',
};

const roleVariant: Record<string, 'primary' | 'info' | 'warning'> = {
  customer: 'info', vendor: 'primary', admin: 'warning',
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<AdminManagedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    users.getById(userId)
      .then((u) => { setUser(u); setRoleInput(u.role); })
      .catch((err) => setError(err.message || 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleBanToggle = async () => {
    if (!user) return;
    try {
      setError(null);
      if (user.status === 'active') {
        await users.ban(user.id);
        setUser({ ...user, status: 'banned' });
      } else {
        await users.unban(user.id);
        setUser({ ...user, status: 'active' });
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  };

  const handleChangeRole = async () => {
    if (!user || roleInput === user.role) { setShowRoleModal(false); return; }
    try {
      setError(null);
      await users.changeRole(user.id, roleInput);
      setUser({ ...user, role: roleInput });
      setShowRoleModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to change role');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-700">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">User Details</h1>
          <p className="mt-1 text-sm text-gray-500">ID: {userId}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setRoleInput(user.role); setShowRoleModal(true); }} className="btn-secondary text-sm">
            Change Role
          </button>
          <button
            onClick={handleBanToggle}
            className={user.status === 'active' ? 'btn-danger text-sm' : 'btn-success text-sm'}
          >
            {user.status === 'active' ? 'Ban User' : 'Unban User'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="card border border-brand-200 bg-brand-50">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Change Role</h3>
          <div className="flex items-center gap-3">
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="input max-w-xs"
            >
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleChangeRole} className="btn-primary text-sm">Save</button>
            <button onClick={() => setShowRoleModal(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="card">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-500/25 ring-4 ring-brand-100">
              {user.name.charAt(0)}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-3 flex gap-2">
              <Badge variant={roleVariant[user.role] ?? 'gray'}>{user.role}</Badge>
              <Badge variant={statusVariant[user.status] ?? 'gray'}>{user.status}</Badge>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="card lg:col-span-2">
          <h3 className="font-display mb-4 text-base font-semibold text-gray-900">User Information</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm capitalize text-gray-900">{user.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm capitalize text-gray-900">{user.status}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 font-mono text-xs text-gray-500">{user.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Joined</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString('en-IN')}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
