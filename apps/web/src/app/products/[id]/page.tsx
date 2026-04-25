'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { catalog, cart as cartApi, reviews as reviewsApi, formatPrice, type Product, type Review, type Variant } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      catalog.getProduct(id),
      reviewsApi.getByProduct(id).catch(() => []),
    ])
      .then(([prod, revs]) => {
        setProduct(prod);
        setReviews(revs);
        if (prod.variants?.length) setSelectedVariant(prod.variants[0]);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    setCartMessage('');
    try {
      const updatedCart = await cartApi.addItem(product.id, quantity, selectedVariant?.id);
      
      if (updatedCart && updatedCart.items) {
        const count = updatedCart.items.reduce((acc, item) => acc + item.quantity, 0);
        localStorage.setItem('cart_count', count.toString());
        window.dispatchEvent(new Event('cart-updated'));
      }

      setCartMessage('Added to cart!');
      setTimeout(() => setCartMessage(''), 3000);
    } catch {
      setCartMessage('Failed to add to cart. Please login first.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const review = await reviewsApi.create({
        productId: product.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews((prev) => [review, ...prev]);
      setReviewComment('');
      setReviewRating(5);
    } catch {
      // silent fail
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square rounded-xl bg-gray-200" />
            <div className="space-y-4">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-8 w-2/3 rounded bg-gray-200" />
              <div className="h-6 w-1/4 rounded bg-gray-200" />
              <div className="h-24 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link href="/products" className="btn-primary mt-6 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ?? 0;
  const currentPrice = selectedVariant?.price ?? product.basePrice;
  const inStock = (selectedVariant?.stockQuantity ?? totalStock) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50/50 to-white pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex text-sm text-gray-500 font-medium">
        <Link href="/" className="hover:text-brand-700 transition-colors">Home</Link>
        <span className="mx-2 text-gray-300">/</span>
        <Link href="/products" className="hover:text-brand-700 transition-colors">Products</Link>
        {product.category && (
          <>
            <span className="mx-2 text-gray-300">/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-700 transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 mt-8">
        {/* Images */}
        <div className="flex flex-col-reverse lg:flex-row gap-6 lg:sticky lg:top-24 h-max">
          {product.images?.length > 1 && (
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] scroll-carousel pb-2 lg:pb-0 hide-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
                    i === selectedImage ? 'border-brand-500 ring-4 ring-brand-500/20 shadow-xl scale-105' : 'border-transparent hover:border-brand-300 bg-white/60 hover:bg-white shadow-sm hover:shadow-md opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
          <div className="relative flex-1 aspect-square lg:aspect-[4/5] overflow-hidden rounded-[3rem] bg-gradient-to-br from-warm-100 to-white shadow-2xl border border-white flex items-center justify-center p-10 group">
            <div className="absolute inset-0 bg-brand-400 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity duration-700"></div>
            <img
              src={product.images?.[selectedImage]?.url || '/placeholder-product.png'}
              alt={product.images?.[selectedImage]?.alt || product.name}
              className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-2xl hover:scale-110 transition-transform duration-700 relative z-10"
            />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col pt-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-700 bg-brand-100/50 w-max mb-4 shadow-sm border border-brand-200/50">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            {product.category?.name || 'Premium Product'}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>

          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex text-amber-400 drop-shadow-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-xl">{i < Math.round(product.averageRating!) ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                {product.averageRating.toFixed(1)} / 5.0
              </span>
              <span className="text-sm text-gray-400 underline decoration-gray-300 underline-offset-4">
                ({product.reviewCount} verified reviews)
              </span>
            </div>
          )}

          <div className="mt-8 flex items-baseline gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-sm inline-block w-max">
            <span className="text-4xl font-extrabold bg-gradient-to-r from-brand-700 to-earth-700 bg-clip-text text-transparent">
              {formatPrice(currentPrice)}
            </span>
            {product.salePrice != null && product.salePrice < product.basePrice && (
              <>
                <span className="text-xl text-gray-400 line-through decoration-red-400/50">
                  {formatPrice(product.basePrice)}
                </span>
                <span className="rounded-xl bg-red-500/10 px-3 py-1 text-sm font-bold text-red-600 border border-red-200/50">SAVE {Math.round((1 - product.salePrice / product.basePrice) * 100)}%</span>
              </>
            )}
            {product.unit && <span className="text-base text-gray-500 font-medium ml-2">/ {product.unit}</span>}
          </div>

          <p className="mt-8 text-lg text-gray-600 leading-relaxed font-medium">{product.description}</p>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">Options</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                      selectedVariant?.id === v.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-brand-400'
                    } ${(v.stockQuantity ?? 0) === 0 ? 'opacity-50' : ''}`}
                    disabled={(v.stockQuantity ?? 0) === 0}
                  >
                    {v.name} — {formatPrice(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center rounded-2xl border border-gray-200 bg-white h-16 shadow-sm p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-full px-5 text-2xl font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
              >
                −
              </button>
              <span className="min-w-[4rem] text-center text-lg font-bold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="h-full px-5 text-2xl font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
              >
                +
              </button>
            </div>
            <div className="flex flex-1 w-full gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className="relative flex-1 rounded-2xl border-2 border-brand-600 text-brand-700 bg-brand-50 h-16 text-lg font-bold tracking-wide shadow-sm transition-all duration-300 hover:bg-brand-100 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                <span className="absolute inset-0 w-full h-full -ml-10 bg-white/30 transform skew-x-12 -translate-x-full group-hover:animate-shine" />
                {addingToCart ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                onClick={() => { handleAddToCart().then(() => { if (inStock) window.location.href = '/checkout'; }); }}
                disabled={!inStock || addingToCart}
                className="flex-1 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 h-16 text-white text-lg font-bold tracking-wide shadow-xl transition-all duration-300 hover:shadow-brand-500/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Buy Now
              </button>
            </div>
          </div>

          {cartMessage && (
            <div className={`mt-4 rounded-xl p-4 text-sm font-bold flex items-center justify-center animate-fade-in ${cartMessage.includes('Failed') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-brand-50 text-brand-700 border border-brand-100'}`}>
              {cartMessage.includes('Failed') ? '⚠️ ' : '✅ '} {cartMessage}
            </div>
          )}

          {/* Premium Features Grid */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-gray-100/60 hover:border-brand-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xl">🌱</div>
              <div>
                <p className="text-sm font-bold text-gray-900">100% Organic</p>
                <p className="text-xs text-gray-500">Chemical-free</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-gray-100/60 hover:border-brand-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xl">🚜</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Farm Direct</p>
                <p className="text-xs text-gray-500">No middlemen</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-gray-100/60 hover:border-brand-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xl">⚡</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Fast Delivery</p>
                <p className="text-xs text-gray-500">Same day available</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-gray-100/60 hover:border-brand-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xl">🛡️</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Secure Pay</p>
                <p className="text-xs text-gray-500">100% Protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-24 pt-16 border-t border-gray-100/60">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-4xl font-bold text-gray-900">
            Customer Reviews {reviews.length > 0 && <span className="text-2xl text-brand-600 ml-2">({reviews.length})</span>}
          </h2>
        </div>

        {isAuthenticated && (
          <form onSubmit={handleSubmitReview} className="mb-12 rounded-3xl border border-white bg-white/60 backdrop-blur-xl shadow-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-earth-400"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share your experience</h3>
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`text-4xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-amber-400 drop-shadow-md' : 'text-gray-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="What did you love about this product?"
              className="w-full rounded-2xl border-gray-200 bg-white/80 py-4 px-5 text-gray-700 shadow-inner focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
              rows={4}
              required
            />
            <button type="submit" disabled={submittingReview} className="mt-6 rounded-2xl bg-gray-900 hover:bg-brand-600 px-8 py-4 text-white font-bold tracking-wide shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 w-full sm:w-auto">
              {submittingReview ? 'Posting Review...' : 'Post Review'}
            </button>
          </form>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="rounded-3xl border border-white bg-white/80 backdrop-blur p-6 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-earth-100 text-lg font-bold text-brand-700 ring-2 ring-white shadow-sm">
                      {review.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{review.user.name}</p>
                      <time className="text-xs font-medium text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </time>
                    </div>
                  </div>
                  <div className="flex text-amber-400 text-sm drop-shadow-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed italic">&ldquo;{review.comment}&rdquo;</p>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
              <span className="text-4xl mb-4 block">📝</span>
              <p className="text-lg font-medium text-gray-600">No reviews yet.</p>
              <p className="text-gray-500 mt-1">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </section>
    </div>
    </div>
  );
}
