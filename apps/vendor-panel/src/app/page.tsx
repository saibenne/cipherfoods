'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/StatsCard';
import Badge from '@/components/ui/Badge';
import { BarChart } from '@/components/ui/Chart';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { vendor, orders, inventory, reviews, formatPrice, formatDateTime } from '@/lib/api';
import type { EarningsResponse, Order, InventoryItem, Review } from '@/lib/api';

const MOCK_REVENUE_7D = [
  { label: 'Mon', value: 4200 },
  { label: 'Tue', value: 3100 },
  { label: 'Wed', value: 5800 },
  { label: 'Thu', value: 4900 },
  { label: 'Fri', value: 7200 },
  { label: 'Sat', value: 8400 },
  { label: 'Sun', value: 6100 },
];

const ORDER_FUNNEL = [
  { label: 'Pending', count: 12, color: 'bg-amber-500', width: '100%' },
  { label: 'Confirmed', count: 9, color: 'bg-blue-500', width: '75%' },
  { label: 'Shipped', count: 6, color: 'bg-purple-500', width: '50%' },
  { label: 'Delivered', count: 4, color: 'bg-emerald-500', width: '33%' },
];

const RevenueIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

const OrdersIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const RatingIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const ProductsActiveIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'primary',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export default function DashboardPage() {
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [e, o, ls, r] = await Promise.all([
          vendor.getEarnings().catch(() => null),
          orders.list({ limit: '5', sort: 'createdAt:desc' }).catch(() => ({ items: [] })),
          inventory.getLowStock().catch(() => []),
          reviews.getVendorReviews({ limit: '5', hasReply: 'false' }).catch(() => ({ items: [] })),
        ]);
        setEarnings(e);
        setRecentOrders((o as { items: Order[] }).items || []);
        setLowStock(Array.isArray(ls) ? ls : []);
        setPendingReviews((r as { items: Review[] }).items || []);
      } catch {
        // fail silently on dashboard
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back! Here&apos;s your store overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/products/new" className="btn-primary text-sm">
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </Link>
          <Link href="/inventory" className="btn-secondary text-sm">View Inventory</Link>
          <Link href="/earnings" className="btn-secondary text-sm hidden sm:inline-flex">Check Earnings</Link>
        </div>
      </div>

      {/* Stats Row — 4 KPI cards with gradients */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Revenue"
          value={formatPrice(earnings?.totalRevenue || 0)}
          icon={<RevenueIcon />}
          trend={{ value: 12.5, isPositive: true }}
          gradient="bg-gradient-to-br from-brand-600 to-brand-800"
        />
        <StatsCard
          title="Orders Today"
          value={earnings?.totalOrders || 0}
          icon={<OrdersIcon />}
          subtitle="All time"
          trend={{ value: 8.3, isPositive: true }}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
        />
        <StatsCard
          title="Avg Rating"
          value="4.6"
          icon={<RatingIcon />}
          subtitle="Based on all reviews"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatsCard
          title="Products Active"
          value={42}
          icon={<ProductsActiveIcon />}
          subtitle="3 drafts"
          gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
      </div>

      {/* Revenue Chart & Order Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Revenue — Last 7 Days</h2>
          <BarChart data={MOCK_REVENUE_7D} height={180} />
        </div>

        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Order Funnel</h2>
          <div className="space-y-3">
            {ORDER_FUNNEL.map((stage) => (
              <div key={stage.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{stage.label}</span>
                  <span className="font-semibold text-gray-900">{stage.count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${stage.color} transition-all duration-500`} style={{ width: stage.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm overflow-hidden p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-brand-600 font-medium hover:text-brand-700">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                    <th className="pb-2 font-semibold">Order</th>
                    <th className="pb-2 font-semibold">Amount</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-2.5">
                        <Link href={`/orders/${order.id}`} className="font-medium text-gray-900 hover:text-brand-700">
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 font-medium text-gray-900">{formatPrice(order.total)}</td>
                      <td className="py-2.5">
                        <Badge variant={STATUS_BADGE[order.status] || 'gray'}>{order.status}</Badge>
                      </td>
                      <td className="py-2.5 text-gray-500">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            <Link href="/inventory" className="text-sm text-brand-600 font-medium hover:text-brand-700">
              View all →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">All stock levels are healthy</p>
          ) : (
            <div className="space-y-2.5">
              {lowStock.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Threshold: {item.lowStockThreshold}</p>
                  </div>
                  <Badge variant="warning">{item.stock} left</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-gray-900">Recent Reviews</h2>
          <Link href="/reviews" className="text-sm text-brand-600 font-medium hover:text-brand-700">
            View all →
          </Link>
        </div>
        {pendingReviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No reviews awaiting reply</p>
        ) : (
          <div className="space-y-3">
            {pendingReviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-gray-100/60 p-4 transition-shadow hover:shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{review.customer.name}</span>
                    <span className="text-yellow-500" aria-label={`${review.rating} out of 5 stars`}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{review.product.name}</span>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
