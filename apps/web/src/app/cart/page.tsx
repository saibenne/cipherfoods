'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cart as cartApi, promotions, formatPrice, type Cart, type CartItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Breadcrumb from '@/components/ui/Breadcrumb';
import QuantitySelector from '@/components/ui/QuantitySelector';
import EmptyState from '@/components/ui/EmptyState';

const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_THRESHOLD = 499;
const MIN_ORDER = 99;

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [cartData, setCartData] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ discount: number; message?: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    cartApi.get()
      .then(setCartData)
      .catch(() => setCartData(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const subtotal = useMemo(
    () => cartData?.items.reduce((s, item) => s + item.price * item.quantity, 0) || 0,
    [cartData]
  );
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const discount = couponApplied?.discount || cartData?.discount || 0;
  const total = subtotal + delivery - discount;

  const savings = useMemo(
    () =>
      cartData?.items.reduce((s, item) => {
        const compare = item.product?.salePrice || item.product?.basePrice || item.price;
        return s + (compare - item.price) * item.quantity;
      }, 0) || 0,
    [cartData]
  );

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    setUpdatingId(itemId);
    try {
      const updated = await cartApi.updateItem(itemId, quantity);
      setCartData(updated);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch {
      /* silently fail */
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      const updated = await cartApi.removeItem(itemId);
      setCartData(updated);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch {
      /* silently fail */
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    setCouponApplied(null);
    try {
      const res = await promotions.validateCoupon(couponCode.trim(), subtotal);
      if (res.valid) {
        setCouponApplied({ discount: res.discount, message: res.message });
      } else {
        setCouponError(res.message || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Unable to validate coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          icon={
            <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          }
          title="Please login to view your cart"
          description="Sign in to start shopping"
          action={{ label: 'Login', href: '/auth/login' }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          icon={
            <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          }
          title="Your cart is empty"
          description="Looks like you haven't added anything yet"
          action={{ label: 'Start Shopping', href: '/products' }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Cart' }]} />
      <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">Shopping Cart</h1>
      <p className="mt-1 text-sm text-gray-500">{cartData.items.length} item{cartData.items.length !== 1 ? 's' : ''} in your cart</p>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {cartData.items.map((item: CartItem) => (
            <div
              key={item.id}
              className={`flex gap-4 rounded-3xl border border-gray-100/60 bg-white shadow-sm p-4 transition-opacity ${
                updatingId === item.id ? 'opacity-60' : ''
              }`}
            >
              {/* Product Image */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                {item.product?.images?.[0] ? (
                  <img src={item.product.images[0].url} alt={item.product?.name || ''} className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  {item.product ? (
                    <Link href={`/products/${item.product.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                      {item.product.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900">Unknown Product</span>
                  )}
                  {item.variant && (
                    <p className="text-xs text-gray-500">{item.variant.name}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{formatPrice(item.price)}</span>
                    {item.product?.salePrice && item.product.salePrice < item.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(item.product.salePrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(qty) => handleUpdateQuantity(item.id, qty)}
                    min={1}
                    max={item.product?.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ?? 99}
                    size="sm"
                  />
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="rounded-xl px-2 py-1 text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${item.product?.name || 'item'}`}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="hidden text-right sm:block">
                <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}

          {/* Continue Shopping */}
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-80">
          <div className="sticky top-24 rounded-3xl bg-gradient-to-br from-brand-50/80 to-cream-50/80 border border-brand-100/60 p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-gray-900">Order Summary</h2>

            {/* Savings Banner */}
            {savings > 0 && (
              <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                🎉 You&apos;re saving <span className="font-bold">{formatPrice(savings)}</span> on this order!
              </div>
            )}

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className={delivery === 0 ? 'font-medium text-green-600' : 'font-medium text-gray-900'}>
                  {delivery === 0 ? 'FREE' : formatPrice(delivery)}
                </span>
              </div>
              {delivery > 0 && (
                <p className="text-xs text-gray-400">
                  Free delivery on orders above {formatPrice(FREE_DELIVERY_THRESHOLD)}
                </p>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-base font-bold text-brand-700">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="mt-4">
              <label htmlFor="coupon" className="text-sm font-medium text-gray-700">Coupon Code</label>
              <div className="mt-1 flex gap-2">
                <input
                  id="coupon"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="input-field flex-1"
                  disabled={!!couponApplied}
                />
                {couponApplied ? (
                  <button
                    onClick={() => {
                      setCouponApplied(null);
                      setCouponCode('');
                    }}
                    className="shrink-0 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                )}
              </div>
              {couponApplied && (
                <p className="mt-1 text-sm text-green-600">{couponApplied.message || `Coupon applied! You save ${formatPrice(couponApplied.discount)}`}</p>
              )}
              {couponError && (
                <p className="mt-1 text-sm text-red-500">{couponError}</p>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => router.push('/checkout')}
              disabled={subtotal < MIN_ORDER}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-brand-700 hover:to-brand-800 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to Checkout
            </button>
            {subtotal < MIN_ORDER && (
              <p className="mt-2 text-center text-xs text-red-500">
                Minimum order amount is {formatPrice(MIN_ORDER)}
              </p>
            )}

            {/* Trust Signals */}
            <div className="mt-4 space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Easy returns within 7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
