'use client';

import { useEffect, useState } from 'react';
import { reviews as reviewsApi, formatDate } from '@/lib/api';
import type { Review } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`${sz} ${i < rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [replyModal, setReplyModal] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [page]);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await reviewsApi.getVendorReviews({ page: String(page), limit: '20' });
      setReviewList(res.items);
      setTotalPages(res.totalPages);
    } catch {
      setReviewList([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!replyModal || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await reviewsApi.reply(replyModal.id, replyText.trim());
      setReviewList((prev) =>
        prev.map((r) => (r.id === replyModal.id ? updated : r))
      );
      setReplyModal(null);
      setReplyText('');
    } catch {
      alert('Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered =
    ratingFilter === 'all'
      ? reviewList
      : reviewList.filter((r) => r.rating === Number(ratingFilter));

  const avgRating = reviewList.length
    ? (reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500">Customer feedback and your responses</p>
        </div>
        {reviewList.length > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-100/60 bg-white px-4 py-2.5 shadow-sm">
            <Stars rating={Math.round(Number(avgRating))} size="md" />
            <span className="text-xl font-bold text-gray-900">{avgRating}</span>
            <span className="text-sm text-gray-400">({reviewList.length})</span>
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-50 p-1">
        {(['all', '5', '4', '3', '2', '1'] as RatingFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setRatingFilter(f)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-all ${
              ratingFilter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : `${f} ★`}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={4} columns={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={ratingFilter !== 'all' ? `No ${ratingFilter}-star reviews` : 'No reviews yet'}
          description="Reviews will appear here as customers leave feedback"
        />
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((review) => (
              <div key={review.id} className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                        {review.customer.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-900">{review.customer.name}</span>
                      <Stars rating={review.rating} />
                      <Badge variant={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'warning' : 'danger'}>
                        {review.rating}/5
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {review.product.name} · {formatDate(review.createdAt)}
                    </p>
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed">{review.comment}</p>

                    {/* Existing reply */}
                    {review.reply && (
                      <div className="mt-3 rounded-lg border-l-4 border-brand-300 bg-brand-50/60 p-3">
                        <div className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                          </svg>
                          <p className="text-xs font-semibold text-brand-700">Your Reply</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{review.reply}</p>
                      </div>
                    )}
                  </div>

                  {/* Reply button */}
                  {!review.reply && (
                    <button
                      onClick={() => { setReplyModal(review); setReplyText(''); }}
                      className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reply Modal */}
      <Modal isOpen={!!replyModal} onClose={() => setReplyModal(null)} title="Reply to Review">
        {replyModal && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{replyModal.customer.name}</span>
                <Stars rating={replyModal.rating} />
              </div>
              <p className="mt-1 text-xs text-gray-500">{replyModal.product.name}</p>
              <p className="mt-1.5 text-sm text-gray-700">{replyModal.comment}</p>
            </div>
            <div>
              <label className="label" htmlFor="reply-text">Your Reply</label>
              <textarea
                id="reply-text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="input-field min-h-[100px] resize-y"
                placeholder="Write a professional and helpful response..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setReplyModal(null)} className="btn-secondary text-sm">Cancel</button>
              <button
                onClick={handleReply}
                disabled={submitting || !replyText.trim()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Submit Reply'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
