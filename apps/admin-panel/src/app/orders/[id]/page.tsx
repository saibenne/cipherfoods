'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orders, type Order } from '@/lib/api';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const statusColors: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  preparing: 'badge-info',
  shipped: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    orders.getById(params.id as string)
      .then(setOrder)
      .catch(() => router.replace('/orders'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-secondary">
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order info */}
        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-lg font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order Status</span>
                <span className={statusColors[order.status] || 'badge-gray'}>{order.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment</span>
                <span className={order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Customer</h3>
            <p className="text-sm font-medium text-gray-900">{order.userName}</p>
            <p className="mt-1 text-xs text-gray-500">ID: {order.userId}</p>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Vendor</h3>
            <p className="text-sm font-medium text-gray-900">{order.vendorName}</p>
            <p className="mt-1 text-xs text-gray-500">ID: {order.vendorId}</p>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Delivery Address</h3>
            <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  {new Date(order.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-700">
                  {new Date(order.updatedAt).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
