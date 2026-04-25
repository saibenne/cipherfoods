'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { orders, formatPrice, formatDateTime } from '@/lib/api';
import type { Order } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'primary' | 'gray' | 'success' | 'danger'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'primary',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

const PAYMENT_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'gray',
};

export default function OrdersPage() {
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: '20' };
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await orders.list(params);
        setOrderList(res.items);
        setTotalPages(res.totalPages);
      } catch {
        setOrderList([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, statusFilter]);

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      const updated = await orders.updateStatus(orderId, newStatus);
      setOrderList((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch {
      alert('Failed to update order status');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">Manage incoming orders</p>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-50 p-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium capitalize transition-all ${
              statusFilter === s
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : orderList.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={statusFilter !== 'all' ? `No ${statusFilter} orders at the moment` : 'Orders will appear here when customers make purchases'}
        />
      ) : (
        <>
          {/* Order cards */}
          <div className="space-y-3">
            {orderList.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl bg-white border border-gray-100/60 shadow-sm overflow-hidden p-0 transition-shadow hover:shadow-md"
              >
                {/* Colored top accent */}
                <div className={`h-1 ${
                  order.status === 'pending' ? 'bg-amber-400' :
                  order.status === 'confirmed' ? 'bg-blue-400' :
                  order.status === 'processing' ? 'bg-indigo-400' :
                  order.status === 'shipped' ? 'bg-purple-400' :
                  order.status === 'delivered' ? 'bg-emerald-400' :
                  order.status === 'cancelled' ? 'bg-red-400' :
                  'bg-gray-200'
                }`} />
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-base font-semibold text-gray-900 hover:text-brand-700"
                        >
                          #{order.orderNumber}
                        </Link>
                        <Badge variant={STATUS_VARIANT[order.status] || 'gray'}>
                          <span className="rounded-full px-3 py-1 text-xs font-semibold">{order.status}</span>
                        </Badge>
                        <Badge variant={PAYMENT_VARIANT[order.paymentStatus] || 'gray'}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          {order.customer.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDateTime(order.createdAt)}
                        </span>
                        <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                        <span className="uppercase text-xs font-medium text-gray-400">{order.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      <p className="text-xl font-bold text-gray-900">{formatPrice(order.total)}</p>

                      {/* Quick status actions */}
                      {order.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                            className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                            className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'processing')}
                          className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          Start Processing
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'shipped')}
                          className="rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100"
                        >
                          Mark Shipped
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        p === page ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
