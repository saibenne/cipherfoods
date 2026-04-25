'use client';

import { useState } from 'react';
import { BarChart, LineChart, DonutChart } from '@/components/ui/Chart';

const dateRanges = ['Today', '7 Days', '30 Days', '90 Days'] as const;

const revenueDailyData = [
  { label: 'Mon', value: 42500 },
  { label: 'Tue', value: 38200 },
  { label: 'Wed', value: 51000 },
  { label: 'Thu', value: 47300 },
  { label: 'Fri', value: 56800 },
  { label: 'Sat', value: 62100 },
  { label: 'Sun', value: 44700 },
];

const ordersLineData = [
  { label: 'Week 1', value: 142 },
  { label: 'Week 2', value: 168 },
  { label: 'Week 3', value: 155 },
  { label: 'Week 4', value: 189 },
  { label: 'Week 5', value: 201 },
  { label: 'Week 6', value: 220 },
];

const categoryData = [
  { label: 'Fruits', value: 32 },
  { label: 'Vegetables', value: 28 },
  { label: 'Dairy', value: 18 },
  { label: 'Bakery', value: 12 },
  { label: 'Meat', value: 10 },
];

const customerGrowthData = [
  { label: 'Jan', value: 1200 },
  { label: 'Feb', value: 1350 },
  { label: 'Mar', value: 1580 },
  { label: 'Apr', value: 1720 },
  { label: 'May', value: 1900 },
  { label: 'Jun', value: 2150 },
];

const topVendors = [
  { name: 'Fresh Farms Co.', orders: 342, revenue: 425000, rating: 4.8 },
  { name: 'Organic Valley', orders: 289, revenue: 368000, rating: 4.6 },
  { name: 'Green Basket', orders: 234, revenue: 298000, rating: 4.7 },
  { name: 'Nature\'s Best', orders: 198, revenue: 245000, rating: 4.5 },
  { name: 'Farm Direct', orders: 176, revenue: 218000, rating: 4.4 },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const kpis = [
  { label: 'Avg. Order Value', value: '₹842', change: '+5.2%', positive: true },
  { label: 'Conversion Rate', value: '3.8%', change: '+0.4%', positive: true },
  { label: 'Repeat Customers', value: '42%', change: '+2.1%', positive: true },
  { label: 'Cart Abandonment', value: '28%', change: '-3.5%', positive: true },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState<typeof dateRanges[number]>('30 Days');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Insights across your platform</p>
        </div>
        <div className="flex gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1">
          {dateRanges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
                range === r ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{kpi.value}</p>
            <span className={`mt-1 inline-block text-xs font-semibold ${kpi.positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {kpi.change}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">+12.4%</span>
          </div>
          <BarChart data={revenueDailyData} height={260} color="#4f46e5" />
        </div>
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-gray-900">Orders Trend</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">+15.8%</span>
          </div>
          <LineChart data={ordersLineData} height={260} color="#0ea5e9" filled />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card">
          <h3 className="font-display mb-4 text-lg font-semibold text-gray-900">Sales by Category</h3>
          <DonutChart
            data={categoryData}
            colors={['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']}
            size={200}
          />
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-display mb-4 text-lg font-semibold text-gray-900">Customer Growth</h3>
          <LineChart data={customerGrowthData} height={220} color="#10b981" filled />
        </div>
      </div>

      {/* Top Vendors Table */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-gray-900">Top Vendors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Vendor</th>
                <th className="px-6 py-3 font-semibold">Orders</th>
                <th className="px-6 py-3 font-semibold">Revenue</th>
                <th className="px-6 py-3 font-semibold">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topVendors.map((v, i) => (
                <tr key={v.name} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-3 font-medium text-gray-400">{i + 1}</td>
                  <td className="whitespace-nowrap px-6 py-3 font-medium text-gray-900">{v.name}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-gray-600">{v.orders.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-3 font-medium text-gray-900">{formatCurrency(v.revenue)}</td>
                  <td className="whitespace-nowrap px-6 py-3">
                    <span className="flex items-center gap-1 text-amber-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {v.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
