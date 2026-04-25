'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { orders as ordersApi, formatPrice, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import { OrderCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'info' | 'gray' | 'danger'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'gray',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const FILTER_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    ordersApi.list()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return !['delivered', 'cancelled', 'refunded'].includes(order.status);
    if (activeTab === 'delivered') return order.status === 'delivered';
    if (activeTab === 'cancelled') return ['cancelled', 'refunded'].includes(order.status);
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          icon={
            <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="Please login to view orders"
          description="Sign in to see your order history"
          action={{ label: 'Login', href: '/auth/login' }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Orders' }]} />
      <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">My Orders</h1>

      {/* Filter Tabs */}
      <div className="mt-6 flex gap-1 rounded-2xl border border-gray-100/60 bg-gray-50 p-1" role="tablist">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title={activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}
            description={activeTab === 'all' ? 'Start shopping to see your orders here' : 'Try a different filter'}
            action={activeTab === 'all' ? { label: 'Start Shopping', href: '/products' } : undefined}
          />
        ) : (
          filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-3xl border border-gray-100/60 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <Badge variant={STATUS_BADGE[order.status] || 'gray'}>
                  {STATUS_LABEL[order.status] || order.status}
                </Badge>
              </div>

              {/* Items Preview */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-gray-100">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0].url} alt="" className="h-full w-full rounded-md object-cover" />
                      ) : (
                        <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-gray-100 text-xs font-medium text-gray-500">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span>
                <div className="flex items-center gap-2">
                  {order.status === 'delivered' && (
                    <span className="text-sm text-brand-600 hover:text-brand-700">Write Review</span>
                  )}
                  {['shipped', 'out_for_delivery'].includes(order.status) && (
                    <span className="text-sm text-brand-600 hover:text-brand-700">Track</span>
                  )}
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
