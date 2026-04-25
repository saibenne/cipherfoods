'use client';

import { useState } from 'react';
import StatsCard from '@/components/StatsCard';
import { BarChart, LineChart, DonutChart } from '@/components/ui/Chart';
import { formatPrice } from '@/lib/api';

type Range = '7d' | '30d' | '90d';

const RANGE_DATA: Record<Range, { revenue: { label: string; value: number }[]; orders: { label: string; value: number }[] }> = {
  '7d': {
    revenue: [
      { label: 'Mon', value: 4200 },
      { label: 'Tue', value: 3100 },
      { label: 'Wed', value: 5800 },
      { label: 'Thu', value: 4900 },
      { label: 'Fri', value: 7200 },
      { label: 'Sat', value: 8400 },
      { label: 'Sun', value: 6100 },
    ],
    orders: [
      { label: 'Mon', value: 8 },
      { label: 'Tue', value: 5 },
      { label: 'Wed', value: 12 },
      { label: 'Thu', value: 9 },
      { label: 'Fri', value: 15 },
      { label: 'Sat', value: 18 },
      { label: 'Sun', value: 11 },
    ],
  },
  '30d': {
    revenue: [
      { label: 'Week 1', value: 28400 },
      { label: 'Week 2', value: 32100 },
      { label: 'Week 3', value: 27600 },
      { label: 'Week 4', value: 35200 },
    ],
    orders: [
      { label: 'Week 1', value: 62 },
      { label: 'Week 2', value: 71 },
      { label: 'Week 3', value: 58 },
      { label: 'Week 4', value: 79 },
    ],
  },
  '90d': {
    revenue: [
      { label: 'Jan', value: 89000 },
      { label: 'Feb', value: 102000 },
      { label: 'Mar', value: 118000 },
    ],
    orders: [
      { label: 'Jan', value: 198 },
      { label: 'Feb', value: 224 },
      { label: 'Mar', value: 267 },
    ],
  },
};

const TOP_PRODUCTS = [
  { name: 'Organic Turmeric Powder', units: 342, revenue: 68400, rating: 4.8 },
  { name: 'Farm-Fresh Honey 500ml', units: 287, revenue: 57400, rating: 4.7 },
  { name: 'Cold-Pressed Coconut Oil', units: 256, revenue: 64000, rating: 4.6 },
  { name: 'Heritage Basmati Rice 5kg', units: 198, revenue: 59400, rating: 4.5 },
  { name: 'Organic Jaggery 1kg', units: 176, revenue: 26400, rating: 4.4 },
];

const CATEGORY_BREAKDOWN = [
  { label: 'Spices', value: 142, color: '#16a34a' },
  { label: 'Oils', value: 98, color: '#2563eb' },
  { label: 'Grains', value: 87, color: '#d97706' },
  { label: 'Sweeteners', value: 64, color: '#9333ea' },
  { label: 'Others', value: 45, color: '#6b7280' },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('7d');
  const data = RANGE_DATA[range];

  const totalRevenue = data.revenue.reduce((s, d) => s + d.value, 0);
  const totalOrders = data.orders.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-sm text-gray-500">Track your store performance</p>
        </div>
        <div className="flex gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
                range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatPrice(totalRevenue)}
          trend={{ value: 12.5, isPositive: true }}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Orders"
          value={totalOrders}
          trend={{ value: 8.3, isPositive: true }}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Avg Order Value"
          value={formatPrice(totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0)}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
        <StatsCard
          title="Repeat Rate"
          value="34%"
          subtitle="Returning customers"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Revenue Over Time</h2>
          <BarChart data={data.revenue} height={200} />
        </div>
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Orders Over Time</h2>
          <LineChart data={data.orders} height={200} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 text-right font-semibold">Units</th>
                  <th className="pb-2 text-right font-semibold">Revenue</th>
                  <th className="pb-2 text-right font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {TOP_PRODUCTS.map((p) => (
                  <tr key={p.name} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2.5 text-right text-gray-600">{p.units}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900">{formatPrice(p.revenue)}</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {p.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Category Breakdown</h2>
          <DonutChart data={CATEGORY_BREAKDOWN} />
        </div>
      </div>
    </div>
  );
}
