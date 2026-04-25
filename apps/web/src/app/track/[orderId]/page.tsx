'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import { formatPrice } from '@/lib/api';

const TRACKING_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { key: 'confirmed', label: 'Confirmed', icon: 'M5 13l4 4L19 7' },
  { key: 'packed', label: 'Packed', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { key: 'shipped', label: 'Out for Delivery', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
  { key: 'delivered', label: 'Delivered', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a2 2 0 110-4 2 2 0 010 4z' },
];

const MOCK_ORDER = {
  id: 'ORD-1042',
  status: 'shipped',
  estimatedDelivery: '2026-04-07T18:00:00Z',
  deliveryAddress: '123 MG Road, Indiranagar, Bengaluru, Karnataka 560038',
  deliveryPartner: 'Rajesh K.',
  deliveryPhone: '+91 98765 43210',
  items: [
    { id: '1', name: 'Organic Basmati Rice (5kg)', qty: 1, price: 549 },
    { id: '2', name: 'Cold-Pressed Coconut Oil (1L)', qty: 2, price: 349 },
  ],
  total: 1287,
  statusHistory: [
    { status: 'placed', time: '2026-04-05T10:00:00Z' },
    { status: 'confirmed', time: '2026-04-05T10:30:00Z' },
    { status: 'packed', time: '2026-04-06T08:00:00Z' },
    { status: 'shipped', time: '2026-04-07T09:00:00Z' },
  ],
};

function getStepState(stepKey: string, currentStatus: string): 'completed' | 'active' | 'pending' {
  const keys = TRACKING_STEPS.map((s) => s.key);
  const currentIdx = keys.indexOf(currentStatus);
  const stepIdx = keys.indexOf(stepKey);
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = MOCK_ORDER;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[
        { label: 'Orders', href: '/orders' },
        { label: `#${orderId}`, href: `/orders/${orderId}` },
        { label: 'Track' },
      ]} />

      <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">Track Order #{orderId}</h1>

      {/* ETA */}
      <div className="mt-6 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50/80 to-cream-50/80 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
            <svg className="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estimated Delivery</p>
            <p className="font-semibold text-gray-900">
              {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
              {' '}by 6:00 PM
            </p>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="mt-8">
        <div className="relative flex flex-col gap-0">
          {TRACKING_STEPS.map((step, idx) => {
            const state = getStepState(step.key, order.status);
            const historyEntry = order.statusHistory.find((h) => h.status === step.key);
            return (
              <div key={step.key} className="flex gap-4">
                {/* Connector + Circle */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    state === 'completed'
                      ? 'border-brand-600 bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                      : state === 'active'
                      ? 'border-brand-600 bg-white text-brand-600 ring-4 ring-brand-100 shadow-md'
                      : 'border-gray-300 bg-white text-gray-300'
                  }`}>
                    {state === 'completed' ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                      </svg>
                    )}
                  </div>
                  {idx < TRACKING_STEPS.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[2rem] rounded-full transition-all duration-500 ${
                      state === 'completed' ? 'bg-gradient-to-b from-brand-500 to-brand-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                {/* Label + Time */}
                <div className="pb-6 pt-2">
                  <p className={`font-medium ${
                    state === 'pending' ? 'text-gray-400' : 'text-gray-900'
                  }`}>{step.label}</p>
                  {historyEntry && (
                    <p className="text-sm text-gray-500">{formatDate(historyEntry.time)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Partner */}
      {order.status === 'shipped' && (
        <div className="mt-6 rounded-3xl bg-white border border-gray-100/60 shadow-sm p-5">
          <h3 className="font-display text-sm font-semibold text-gray-900">Delivery Partner</h3>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
              {order.deliveryPartner.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{order.deliveryPartner}</p>
              <p className="text-sm text-gray-500">{order.deliveryPhone}</p>
            </div>
            <a
              href={`tel:${order.deliveryPhone.replace(/\s/g, '')}`}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100"
              aria-label="Call delivery partner"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Delivery Address */}
      <div className="mt-4 rounded-3xl bg-white border border-gray-100/60 shadow-sm p-5">
        <h3 className="font-display text-sm font-semibold text-gray-900">Delivery Address</h3>
        <p className="mt-2 text-sm text-gray-600">{order.deliveryAddress}</p>
      </div>

      {/* Map Placeholder */}
      <div className="mt-4 flex h-48 items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50">
        <div className="text-center">
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-400">Live map tracking coming soon</p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="mt-6 rounded-3xl bg-white border border-gray-100/60 shadow-sm p-5">
        <h3 className="font-display text-sm font-semibold text-gray-900">Order Items</h3>
        <ul className="mt-3 divide-y divide-gray-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-700">{item.name} × {item.qty}</span>
              <span className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-brand-700">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Link href={`/orders/${orderId}`} className="flex-1 text-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-white font-semibold shadow-lg transition-all hover:shadow-xl">
          View Order Details
        </Link>
        <Link href="/support" className="flex-1 rounded-2xl border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm">
          Need Help?
        </Link>
      </div>
    </div>
  );
}
