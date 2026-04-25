'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/StatsCard';
import { vendor, formatPrice, formatDate } from '@/lib/api';
import type { EarningsResponse } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import { BarChart } from '@/components/ui/Chart';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const PAYOUT_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  completed: 'success',
  processing: 'info',
  pending: 'warning',
  failed: 'danger',
};

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendor.getEarnings()
      .then(setEarnings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500">Revenue breakdown and payout history</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500">Revenue breakdown and payout history</p>
        </div>
        <EmptyState title="Unable to load earnings data" description="Please try again later" />
      </div>
    );
  }

  // Build chart data from monthly breakdown
  const chartData = earnings.monthlyBreakdown.slice(-7).map((m) => ({
    label: m.month.slice(0, 3),
    value: m.revenue,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-sm text-gray-500">Revenue breakdown and payout history</p>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatPrice(earnings.totalRevenue)}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="This Month"
          value={formatPrice(earnings.thisMonthRevenue)}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatsCard
          title="Pending Payout"
          value={formatPrice(earnings.pendingPayout)}
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Orders"
          value={String(earnings.totalOrders)}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          }
        />
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Revenue Trend</h2>
          <BarChart data={chartData} height={220} />
        </div>
      )}

      {/* Monthly breakdown */}
      <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Monthly Breakdown</h2>
        {earnings.monthlyBreakdown.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Month</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Revenue</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Orders</th>
                  <th className="hidden px-4 py-3 font-medium text-gray-600 sm:table-cell">Avg Order Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {earnings.monthlyBreakdown.map((m) => (
                  <tr key={m.month} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.month}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(m.revenue)}</td>
                    <td className="px-4 py-3 text-gray-600">{m.orders}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                      {m.orders > 0 ? formatPrice(Math.round(m.revenue / m.orders)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Payout History</h2>
        {earnings.payouts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No payouts yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {earnings.payouts.map((payout) => (
                  <tr key={payout.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-900">{formatDate(payout.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(payout.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={PAYOUT_VARIANT[payout.status] || 'gray'}>
                        {payout.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{payout.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
