'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatPrice, cart as cartApi, type Product } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

interface ProductCardProps {
  product: Product;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
}

export default function ProductCard({ product, onWishlistToggle, isWishlisted = false }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && product.images && product.images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
      }, 1000);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  const imageUrl = product.images?.[currentImageIndex]?.url || '/placeholder-product.png';
  const hasDiscount = product.salePrice != null && product.salePrice < product.basePrice;
  const discountPct = hasDiscount
    ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)
    : 0;
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ?? 0;
  const inStock = totalStock > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;
    setAdding(true);
    try {
      await cartApi.addItem(product.id, quantity);
      setAdded(true);
      setQuantity(1);
      // Update cart count in localStorage for header badge
      try {
        const current = Number(localStorage.getItem('cart_count') || '0');
        localStorage.setItem('cart_count', String(current + quantity));
        window.dispatchEvent(new Event('cart-updated'));
      } catch { /* ignore */ }
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // silently fail — user may not be logged in
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    onWishlistToggle?.(product.id);
  };

  return (
    <div className="group relative overflow-hidden card-product flex flex-col">
      <Link href={`/products/${product.id}`} className="block" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {/* Image */}
        <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-cream-50">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
            loading="lazy"
          />

          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
              -{discountPct}%
            </span>
          )}

          {/* Out of Stock Overlay */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <span className="rounded-2xl bg-white/90 backdrop-blur px-5 py-2 text-sm font-semibold text-gray-900">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick Add Button */}
          {inStock && (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 ${
                added ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {added ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              )}
            </button>
          )}

          {/* Slideshow Progress Bar */}
          {isHovered && product.images && product.images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-2">
              {product.images.map((_, idx) => (
                <div key={idx} className={`h-1 flex-1 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-110"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg className={`h-4 w-4 transition-colors ${wishlisted ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      </button>

      {/* Info */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand-600/80">{product.category?.name}</p>
        <Link href={`/products/${product.id}`}>
          <h3 className="mt-1 sm:mt-1.5 line-clamp-2 text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
            {product.name}
          </h3>
        </Link>
        {/* Rating */}
        {product.averageRating !== undefined && product.averageRating > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating rating={product.averageRating} size="sm" />
            {product.reviewCount !== undefined && (
              <span className="text-[10px] text-gray-400">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-2 flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm font-bold text-gray-900">{formatPrice(hasDiscount ? product.salePrice! : product.basePrice)}</span>
            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.basePrice)}</span>
            )}
            <span className="text-[10px] font-bold text-gray-400">/ PER {product.unit || '1 KILO'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
