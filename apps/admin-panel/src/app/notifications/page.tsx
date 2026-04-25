'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminNotifications, type AdminNotification } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';

const typeVariant: Record<string, 'info' | 'primary' | 'danger'> = {
  info: 'info', promo: 'primary', alert: 'danger',
};

const targetLabels: Record<string, string> = {
  all: 'Everyone', customers: 'Customers', vendors: 'Vendors',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'customers' | 'vendors'>('all');
  const [type, setType] = useState<'info' | 'promo' | 'alert'>('info');
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminNotifications.list();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // Notifications list may not be available yet
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      setError(null);
      await adminNotifications.send({ title, message, target });
      setTitle('');
      setMessage('');
      fetchNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const columns: Column<AdminNotification>[] = [
    {
      header: 'Title',
      accessor: 'title',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{row.body || row.message}</p>
        </div>
      ),
    },
    {
      header: 'Target',
      accessor: 'target',
      render: (_, row) => <span className="text-sm text-gray-600">{targetLabels[row.target] ?? row.target}</span>,
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (_, row) => <Badge variant={typeVariant[row.type] ?? 'info'}>{row.type}</Badge>,
    },
    {
      header: 'Sent',
      accessor: 'createdAt',
      sortable: true,
      render: (_, row) => <span className="text-sm text-gray-500">{new Date(row.createdAt).toLocaleString('en-IN')}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">Send and manage platform notifications</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Send Notification */}
      <div className="card">
        <h3 className="font-display mb-4 text-lg font-semibold text-gray-900">Send Notification</h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="notif-title" className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input id="notif-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="notif-target" className="mb-1 block text-sm font-medium text-gray-700">Target</label>
                <select id="notif-target" value={target} onChange={(e) => setTarget(e.target.value as 'all' | 'customers' | 'vendors')} className="input">
                  <option value="all">Everyone</option>
                  <option value="customers">Customers</option>
                  <option value="vendors">Vendors</option>
                </select>
              </div>
              <div>
                <label htmlFor="notif-type" className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select id="notif-type" value={type} onChange={(e) => setType(e.target.value as 'info' | 'promo' | 'alert')} className="input">
                  <option value="info">Info</option>
                  <option value="promo">Promo</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="notif-msg" className="mb-1 block text-sm font-medium text-gray-700">Message</label>
            <textarea id="notif-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="input" required />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={sending} className="btn-primary text-sm">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Templates */}
      <div className="card">
        <h3 className="font-display mb-3 text-lg font-semibold text-gray-900">Quick Templates</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Flash Sale', t: '🔥 Flash Sale!', m: 'Limited-time offers available now. Shop before they\'re gone!' },
            { label: 'Maintenance', t: '🔧 Scheduled Maintenance', m: 'We will be performing maintenance. Service may be briefly interrupted.' },
            { label: 'Welcome', t: '👋 Welcome!', m: 'Thanks for joining CipherFoods! Explore our fresh products.' },
          ].map((tpl) => (
            <button
              key={tpl.label}
              onClick={() => { setTitle(tpl.t); setMessage(tpl.m); }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="font-display mb-3 text-lg font-semibold text-gray-900">Notification History</h3>
        <DataTable columns={columns} data={notifications} keyField="id" loading={loading} searchable searchPlaceholder="Search notifications..." />
      </div>
    </div>
  );
}
