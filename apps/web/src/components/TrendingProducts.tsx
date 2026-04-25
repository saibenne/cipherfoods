'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { catalog, type Product } from '@/lib/api';

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalog.getProducts({ limit: '8', sortBy: 'averageRating', sortOrder: 'DESC' })
      .then(res => setProducts(res.items || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-cream-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-gray-900">Trending Products</h2>
            <p className="mt-2 text-sm text-gray-500">What our customers love right now</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl bg-gray-100 aspect-[4/3]" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl bg-gray-50 py-16 text-center">
            <p className="text-lg font-medium text-gray-500">Products coming soon!</p>
            <p className="mt-1 text-sm text-gray-400">Our farmers are preparing fresh produce for you.</p>
          </div>
        )}
      </div>
    </section>
  );
}
