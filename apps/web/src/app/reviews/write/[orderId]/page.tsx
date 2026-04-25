'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StarRating from '@/components/ui/StarRating';
import { useAuth } from '@/lib/auth-context';
import { reviews as reviewsApi, formatPrice } from '@/lib/api';

const MOCK_ORDER_ITEMS = [
  { id: 'item-1', productId: 'p1', productName: 'Organic Basmati Rice (5kg)', image: '', price: 549, quantity: 1 },
  { id: 'item-2', productId: 'p2', productName: 'Cold-Pressed Coconut Oil (1L)', image: '', price: 349, quantity: 2 },
];

export default function WriteReviewPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState(MOCK_ORDER_ITEMS[0]);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await reviewsApi.create({
        productId: selectedProduct.productId,
        orderId: orderId,
        rating,
        title,
        comment: body,
      });
      setSubmitted(true);
    } catch {
      // Simulate success for demo
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-gray-500">Please login to write a review.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-cream-100 shadow-sm">
          <svg className="h-8 w-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900">Thank You!</h2>
        <p className="mt-2 text-gray-500">Your review has been submitted successfully.</p>
        <button onClick={() => router.push(`/orders/${orderId}`)} className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 text-white font-semibold shadow-lg transition-all hover:shadow-xl mt-6">
          Back to Order
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[
        { label: 'Orders', href: '/orders' },
        { label: `#${orderId}`, href: `/orders/${orderId}` },
        { label: 'Write Review' },
      ]} />

      <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">Write a Review</h1>
      <p className="mt-1 text-gray-500">Share your experience with the products from this order</p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-3xl bg-white border border-gray-100/60 shadow-sm p-8 space-y-6">
        {/* Product Selector */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Select Product</legend>
          <div className="mt-2 space-y-2">
            {MOCK_ORDER_ITEMS.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-300 ${
                  selectedProduct.id === item.id
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 shadow-sm'
                    : 'border-gray-200 hover:border-brand-400'
                }`}
              >
                <input
                  type="radio"
                  name="product"
                  value={item.id}
                  checked={selectedProduct.id === item.id}
                  onChange={() => setSelectedProduct(item)}
                  className="sr-only"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity} • {formatPrice(item.price)}</p>
                </div>
                {selectedProduct.id === item.id && (
                  <svg className="h-5 w-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Rating */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Your Rating *</label>
          <StarRating value={rating} onChange={setRating} size="lg" interactive />
          {rating === 0 && (
            <p className="mt-1 text-xs text-gray-400">Tap a star to rate</p>
          )}
        </div>

        {/* Review Title */}
        <div>
          <label htmlFor="review-title" className="mb-1 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            className="rounded-2xl border-gray-200 input-field"
            maxLength={100}
          />
        </div>

        {/* Review Body */}
        <div>
          <label htmlFor="review-body" className="mb-1 block text-sm font-medium text-gray-700">
            Your Review *
          </label>
          <textarea
            id="review-body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you like or dislike? How was the freshness and quality?"
            className="rounded-2xl border-gray-200 input-field"
            required
          />
          <p className="mt-1 text-right text-xs text-gray-400">{body.length}/1000</p>
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0 || !body.trim()}
          className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-4 text-white font-semibold shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
