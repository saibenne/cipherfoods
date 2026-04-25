'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboard, type DashboardStats, type Order } from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import { BarChart, DonutChart } from '@/components/ui/Chart';
import Badge from '@/components/ui/Badge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

const donutColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#6366f1',
  shipped: '#0ea5e9',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const mockRevenueData = [
  { label: 'Mon', value: 24500 },
  { label: 'Tue', value: 18200 },
  { label: 'Wed', value: 32100 },
  { label: 'Thu', value: 28700 },
  { label: 'Fri', value: 41200 },
  { label: 'Sat', value: 35600 },
  { label: 'Sun', value: 29800 },
];

const mockTopProducts = [
  { label: 'Organic Tomatoes', value: 342 },
  { label: 'Fresh Milk 1L', value: 285 },
  { label: 'Brown Eggs (12)', value: 256 },
  { label: 'Basmati Rice 5kg', value: 198 },
  { label: 'Honey 500g', value: 167 },
];

const mockActivity = [
  { id: '1', type: 'vendor', text: 'New vendor "Green Farms Co." registered', time: '5 min ago' },
  { id: '2', type: 'order', text: 'Order #CF-10234 delivered successfully', time: '12 min ago' },
  { id: '3', type: 'support', text: 'Ticket #45 escalated to high priority', time: '28 min ago' },
  { id: '4', type: 'order', text: 'Order #CF-10231 payment confirmed', time: '45 min ago' },
  { id: '5', type: 'vendor', text: 'Vendor "Organic Roots" updated catalog', time: '1 hr ago' },
  { id: '6', type: 'order', text: 'New order #CF-10235 placed', time: '1 hr ago' },
  { id: '7', type: 'support', text: 'Ticket #44 resolved by admin', time: '2 hr ago' },
];

const activityIconColors: Record<string, string> = {
  vendor: 'bg-purple-100 text-purple-600',
  order: 'bg-blue-100 text-blue-600',
  support: 'bg-amber-100 text-amber-600',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    dashboard.getStats()
      .then(setStats)
      .catch((e) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="card text-center">
          <svg className="mx-auto mb-3 h-12 w-12 text-red-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="font-medium text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-3 text-xs">Retry</button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const orderStatusData = Object.entries(stats.ordersByStatus ?? {}).map(([status, count]) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: donutColors[status] ?? '#9ca3af',
  }));

  const recentOrders = stats.recentOrders ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back! Here&apos;s what&apos;s happening on the platform.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Orders"
          value={(stats.totalOrders ?? 0).toLocaleString('en-IN')}
          trend={{ value: 12.5, isPositive: true }}
          icon={
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
            </div>
          }
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue ?? 0)}
          trend={{ value: 8.2, isPositive: true }}
          icon={
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
          }
        />
        <StatsCard
          title="Total Vendors"
          value={(stats.totalVendors ?? 0).toLocaleString('en-IN')}
          trend={{ value: 3.1, isPositive: true }}
          icon={
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35" />
              </svg>
            </div>
          }
        />
        <StatsCard
          title="Total Users"
          value={(stats.totalUsers ?? 0).toLocaleString('en-IN')}
          trend={{ value: 15.8, isPositive: true }}
          icon={
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">+8.2%</span>
          </div>
          <BarChart data={mockRevenueData.map((d) => ({ ...d, color: 'fill-brand-500' }))} height={220} />
        </div>
        <div className="card">
          <h2 className="font-display mb-4 text-lg font-semibold text-gray-900">Orders by Status</h2>
          {orderStatusData.length > 0 ? (
            <DonutChart data={orderStatusData} size={160} thickness={24} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No order data</p>
          )}
        </div>
      </div>

      {/* Recent Orders + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-gray-900">Recent Orders</h2>
            <button onClick={() => router.push('/orders')} className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3 font-semibold">Order</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.slice(0, 8).map((order: Order) => (
                  <tr key={order.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-3">
                      <button onClick={() => router.push(`/orders/${order.id}`)} className="font-medium text-brand-600 hover:underline">{order.orderNumber}</button>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{order.userName}</td>
                    <td className="whitespace-nowrap px-6 py-3 font-medium text-gray-900">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-3"><Badge variant={statusVariant[order.status] ?? 'gray'}>{order.status}</Badge></td>
                    <td className="whitespace-nowrap px-6 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No recent orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card flex flex-col overflow-hidden p-0">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-gray-900">Activity Feed</h2>
          </div>
          <ul className="flex-1 divide-y divide-gray-50 overflow-y-auto">
            {mockActivity.map((item) => (
              <li key={item.id} className="flex gap-3 px-6 py-3 transition-colors hover:bg-gray-50/50">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${activityIconColors[item.type]}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top Products + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="font-display mb-4 text-lg font-semibold text-gray-900">Top Products</h2>
          <div className="space-y-3">
            {mockTopProducts.map((product, i) => {
              const pct = (product.value / mockTopProducts[0].value) * 100;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-6 text-right text-sm font-medium text-gray-400">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-gray-700">{product.label}</p>
                      <p className="ml-4 text-sm font-semibold text-gray-900">{product.value} sold</p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="font-display mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'View Vendors', href: '/vendors', bg: 'bg-purple-100', color: 'text-purple-600' },
              { label: 'Create Coupon', href: '/promotions', bg: 'bg-amber-100', color: 'text-amber-600' },
              { label: 'View Reports', href: '/analytics', bg: 'bg-blue-100', color: 'text-blue-600' },
              { label: 'Support Tickets', href: '/support', bg: 'bg-red-100', color: 'text-red-600' },
            ].map((action) => (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${action.bg}`}>
                  <svg className={`h-4 w-4 ${action.color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
