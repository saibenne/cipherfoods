'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { orders as ordersApi, formatPrice, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setLoading(false);
      return;
    }
    ordersApi
      .get(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, id]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-gray-500">Please login to view order details</p>
        <Link href="/auth/login" className="btn-primary mt-4 inline-block">Login</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          <div className="h-48 rounded-3xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Order not found</h1>
        <Link href="/orders" className="btn-primary mt-6 inline-block">Back to Orders</Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/orders" className="hover:text-brand-700">Orders</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">#{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span className="text-2xl font-bold text-gray-900">{formatPrice(order.total)}</span>
      </div>

      {/* Order Tracking */}
      {!isCancelled && (
        <div className="mt-8 rounded-3xl border border-gray-100/60 bg-white shadow-sm p-6">
          <h2 className="font-display text-sm font-semibold text-gray-900">Order Status</h2>
          <div className="mt-4 flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex flex-1 flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white ring-4 ring-brand-100'
                        : isActive
                        ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isActive ? '✓' : i + 1}
                  </div>
                  <p
                    className={`mt-2 text-center text-[10px] leading-tight sm:text-xs ${
                      isActive ? 'font-semibold text-brand-700' : 'text-gray-400'
                    }`}
                  >
                    {STATUS_LABELS[step]}
                  </p>
                </div>
              );
            })}
          </div>
          {order.estimatedDelivery && (
            <p className="mt-4 text-center text-sm text-gray-500">
              Estimated delivery:{' '}
              {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {isCancelled && (
        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">
            This order has been {order.status === 'refunded' ? 'refunded' : 'cancelled'}.
          </p>
        </div>
      )}

      {/* Items */}
      <div className="mt-8 rounded-3xl border border-gray-100/60 bg-white shadow-sm p-6">
        <h2 className="font-display text-sm font-semibold text-gray-900">Items</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 py-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-50">
                <img
                  src={item.product.images?.[0]?.url || '/placeholder-product.png'}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="mt-6 rounded-3xl border border-gray-100/60 bg-white shadow-sm p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery</span>
            <span>{order.deliveryCharge === 0 ? <span className="text-brand-600">FREE</span> : formatPrice(order.deliveryCharge)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-brand-600">
              <span>Discount</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <hr />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="mt-6 rounded-3xl border border-gray-100/60 bg-white shadow-sm p-6">
        <h2 className="font-display text-sm font-semibold text-gray-900">Delivery Address</h2>
        <p className="mt-2 text-sm text-gray-600">
          {order.address.addressLine1}
          {order.address.addressLine2 && `, ${order.address.addressLine2}`}
          <br />
          {order.address.city}, {order.address.state} — {order.address.pincode}
        </p>
      </div>

      {/* Payment Info */}
      <div className="mt-6 rounded-3xl border border-gray-100/60 bg-white shadow-sm p-6">
        <h2 className="font-display text-sm font-semibold text-gray-900">Payment</h2>
        <div className="mt-2 flex justify-between text-sm">
          <span className="capitalize text-gray-600">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
          <span className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-brand-600' : 'text-orange-600'}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
