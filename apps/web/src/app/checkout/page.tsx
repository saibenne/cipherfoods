'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cart as cartApi, orders as ordersApi, formatPrice, type Cart, type CreateOrderData } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Breadcrumb from '@/components/ui/Breadcrumb';

const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_THRESHOLD = 499;

const STEPS = [
  { key: 'address', label: 'Address' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
] as const;

type Step = typeof STEPS[number]['key'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [cartData, setCartData] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('address');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  // Address form
  const [address, setAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    phone: user?.phone || '',
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
    cartApi.get()
      .then(setCartData)
      .catch(() => router.push('/cart'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const subtotal = cartData?.items.reduce((s, item) => s + item.price * item.quantity, 0) || 0;
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const discount = cartData?.discount || 0;
  const total = subtotal + delivery - discount;

  const validateAddress = () => {
    if (!address.addressLine1.trim() || !address.city.trim() || !address.state || !address.pincode.trim() || !address.phone.trim()) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }
    if (!/^\+?\d{10,13}$/.test(address.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 'address') {
      if (validateAddress()) setStep('payment');
    } else if (step === 'payment') {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'payment') setStep('address');
    else if (step === 'review') setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      const orderData: CreateOrderData = {
        addressLine1: address.addressLine1.trim(),
        addressLine2: address.addressLine2.trim() || undefined,
        city: address.city.trim(),
        state: address.state,
        pincode: address.pincode.trim(),
        phone: address.phone.trim(),
        paymentMethod,
      };
      const order = await ordersApi.create(orderData);
      window.dispatchEvent(new CustomEvent('cart-updated'));
      router.push(`/orders/${order.id}?placed=true`);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link href="/products" className="btn-primary mt-4 inline-block">
          Browse Products
        </Link>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

      {/* Progress Steps */}
      <nav className="mt-6" aria-label="Checkout steps">
        <ol className="flex items-center">
          {STEPS.map((s, i) => (
            <li key={s.key} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  i < stepIndex
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md'
                    : i === stepIndex
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg ring-4 ring-brand-100'
                    : 'border-2 border-gray-300 text-gray-400'
                }`}>
                  {i < stepIndex ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`hidden text-sm font-medium sm:block ${
                  i <= stepIndex ? 'text-brand-700' : 'text-gray-400'
                }`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-4 h-0.5 flex-1 rounded-full transition-all duration-500 ${i < stepIndex ? 'bg-gradient-to-r from-brand-500 to-brand-600' : 'bg-gray-200'}`} />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Main Content */}
        <div className="flex-1">
          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-100/60 p-3.5 text-sm text-red-700">{error}</div>
          )}

          {/* Address Step */}
          {step === 'address' && (
            <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-6">
              <h2 className="font-display text-2xl font-bold text-gray-900">Delivery Address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="address1" className="mb-1 block text-sm font-medium text-gray-700">
                    Address Line 1 *
                  </label>
                  <input
                    id="address1"
                    type="text"
                    value={address.addressLine1}
                    onChange={(e) => setAddress((a) => ({ ...a, addressLine1: e.target.value }))}
                    placeholder="House/Flat No., Street"
                    className="rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-3.5 input-field"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address2" className="mb-1 block text-sm font-medium text-gray-700">
                    Address Line 2
                  </label>
                  <input
                    id="address2"
                    type="text"
                    value={address.addressLine2}
                    onChange={(e) => setAddress((a) => ({ ...a, addressLine2: e.target.value }))}
                    placeholder="Landmark, Area"
                    className="rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-3.5 input-field"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">City *</label>
                  <input
                    id="city"
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                    className="rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-3.5 input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="mb-1 block text-sm font-medium text-gray-700">State *</label>
                  <select
                    id="state"
                    value={address.state}
                    onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                    className="rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-3.5 input-field"
                    required
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pincode" className="mb-1 block text-sm font-medium text-gray-700">Pincode *</label>
                  <input
                    id="pincode"
                    type="text"
                    value={address.pincode}
                    onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="560001"
                    className="rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-3.5 input-field"
                    inputMode="numeric"
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    id="phone"
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="rounded-2xl border-gray-200 bg-gray-50/50 px-5 py-3.5 input-field"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {step === 'payment' && (
            <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-6">
              <h2 className="font-display text-2xl font-bold text-gray-900">Payment Method</h2>
              <fieldset className="mt-4 space-y-3">
                <legend className="sr-only">Select payment method</legend>
                <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-300 ${
                  paymentMethod === 'cod' ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 shadow-sm' : 'border-gray-200 hover:border-brand-400'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="sr-only"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-earth-100">
                    <svg className="h-5 w-5 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when your order arrives</p>
                  </div>
                  {paymentMethod === 'cod' && (
                    <svg className="ml-auto h-5 w-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>

                <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-300 ${
                  paymentMethod === 'online' ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 shadow-sm' : 'border-gray-200 hover:border-brand-400'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="sr-only"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pay Online</p>
                    <p className="text-sm text-gray-500">UPI, Debit/Credit Card, Net Banking</p>
                  </div>
                  {paymentMethod === 'online' && (
                    <svg className="ml-auto h-5 w-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </fieldset>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Address Review */}
              <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-gray-900">Delivery Address</h3>
                  <button onClick={() => setStep('address')} className="text-sm text-brand-600 hover:text-brand-700">Edit</button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
                  {address.city}, {address.state} – {address.pincode}<br />
                  Phone: {address.phone}
                </p>
              </div>

              {/* Payment Review */}
              <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-gray-900">Payment Method</h3>
                  <button onClick={() => setStep('payment')} className="text-sm text-brand-600 hover:text-brand-700">Edit</button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay Online (UPI/Card/Net Banking)'}
                </p>
              </div>

              {/* Items Review */}
              <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-5">
                <h3 className="font-display text-sm font-semibold text-gray-900">Order Items ({cartData.items.length})</h3>
                <ul className="mt-3 divide-y divide-gray-100">
                  {cartData.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {stepIndex > 0 ? (
              <button onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <Link href="/cart" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Cart
              </Link>
            )}

            {step === 'review' ? (
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 shadow-lg text-white px-6 py-3 font-semibold min-w-[160px] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:shadow-xl"
              >
                {placing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Placing...
                  </span>
                ) : (
                  `Place Order • ${formatPrice(total)}`
                )}
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary">
                Continue
              </button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-72">
          <div className="sticky top-24 rounded-3xl bg-gradient-to-br from-brand-50/80 to-cream-50/80 border border-brand-100/60 shadow-sm p-5">
            <h3 className="font-display text-sm font-bold text-gray-900">Order Summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({cartData.items.length})</span>
                <span className="text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className={delivery === 0 ? 'text-green-600' : 'text-gray-900'}>
                  {delivery === 0 ? 'FREE' : formatPrice(delivery)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-brand-700">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
