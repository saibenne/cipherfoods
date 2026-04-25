'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { type Product } from '@/lib/api';

interface WishlistItem {
  productId: string;
  addedAt: string;
}

function getWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem('wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveWishlist(items: WishlistItem[]) {
  localStorage.setItem('wishlist', JSON.stringify(items));
}

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const items = getWishlist();
    if (items.length === 0) { setLoading(false); return; }
    // For now, load products from catalog API by fetching all and filtering
    import('@/lib/api').then(({ catalog }) => {
      catalog.getProducts({ limit: '50' })
        .then((res) => {
          const ids = new Set(items.map((w) => w.productId));
          setWishlistProducts(res.items.filter((p) => ids.has(p.id)));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const handleRemove = (productId: string) => {
    const items = getWishlist().filter((w) => w.productId !== productId);
    saveWishlist(items);
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleWishlistToggle = (productId: string) => {
    handleRemove(productId);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Wishlist' }]} />
      <h1 className="font-display text-2xl font-bold text-gray-900">My Wishlist</h1>
      <p className="mt-1 text-sm text-gray-500">
        {wishlistProducts.length} item{wishlistProducts.length !== 1 ? 's' : ''} saved
      </p>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-1/2 rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-cream-100">
                <svg className="h-10 w-10 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </div>
            }
            title="Your wishlist is empty"
            description="Save items you love to your wishlist and come back to them later."
            actionLabel="Browse Products"
            actionHref="/products"
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlistProducts.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard
                product={product}
                isWishlisted={true}
                onWishlistToggle={handleWishlistToggle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
