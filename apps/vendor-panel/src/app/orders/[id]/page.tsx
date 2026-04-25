'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orders, delivery, formatPrice, formatDateTime } from '@/lib/api';
import type { Order, DeliveryInfo } from '@/lib/api';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [o, d] = await Promise.all([
          orders.get(id),
          delivery.getByOrder(id).catch(() => null),
        ]);
        setOrder(o);
        setDeliveryInfo(d);
      } catch {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleStatusUpdate(newStatus: string) {
    if (!order) return;
    try {
      const updated = await orders.updateStatus(order.id, newStatus);
      setOrder(updated);
    } catch {
      alert('Failed to update status');
    }
  }

  function getNextStatus(current: string): string | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-red-600">{error || 'Order not found'}</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button onClick={() => router.back()} className="mb-2 text-sm text-gray-500 hover:text-gray-700">
            ← Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {order.status}
          </span>
          {nextStatus && (
            <button
              onClick={() => handleStatusUpdate(nextStatus)}
              className="btn-primary text-sm"
            >
              Mark as {nextStatus}
            </button>
          )}
          {order.status === 'pending' && (
            <button
              onClick={() => handleStatusUpdate('cancelled')}
              className="btn-danger text-sm"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-lg border border-gray-50 p-3">
                {item.product.image && (
                  <img src={item.product.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">× {item.quantity}</p>
                  <p className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>
              <span className="text-gray-900">{formatPrice(order.deliveryCharge)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Customer</h3>
            <p className="font-medium text-gray-900">{order.customer.name}</p>
            <p className="text-sm text-gray-500">{order.customer.email}</p>
            <p className="text-sm text-gray-500">{order.customer.phone}</p>
          </div>

          {/* Delivery address */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Delivery Address</h3>
            <p className="text-sm text-gray-900">{order.address.addressLine1}</p>
            {order.address.addressLine2 && <p className="text-sm text-gray-900">{order.address.addressLine2}</p>}
            <p className="text-sm text-gray-900">{order.address.city}, {order.address.state} {order.address.pincode}</p>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Payment</h3>
            <p className="text-sm text-gray-900">Method: {order.paymentMethod.toUpperCase()}</p>
            <p className="text-sm text-gray-900">
              Status:{' '}
              <span className={order.paymentStatus === 'paid' ? 'font-medium text-green-600' : 'text-yellow-600'}>
                {order.paymentStatus}
              </span>
            </p>
          </div>

          {/* Delivery tracking */}
          {deliveryInfo && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Delivery Tracking</h3>
              {deliveryInfo.trackingNumber && (
                <p className="text-sm text-gray-900">Tracking: {deliveryInfo.trackingNumber}</p>
              )}
              {deliveryInfo.carrier && (
                <p className="text-sm text-gray-500">{deliveryInfo.carrier}</p>
              )}
              {deliveryInfo.estimatedDelivery && (
                <p className="text-sm text-gray-500">ETA: {formatDateTime(deliveryInfo.estimatedDelivery)}</p>
              )}
              {deliveryInfo.events?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {deliveryInfo.events.map((evt, i) => (
                    <div key={i} className="border-l-2 border-brand-200 pl-3">
                      <p className="text-xs font-medium text-gray-900">{evt.status}</p>
                      <p className="text-xs text-gray-500">{evt.description}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(evt.timestamp)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
