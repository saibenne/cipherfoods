'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { catalog, type Category, type Product } from '@/lib/api';

interface CategoryProductsProps {
  categories: Category[];
}

export default function CategoryProducts({ categories }: CategoryProductsProps) {
  const [categoryData, setCategoryData] = useState<{ category: Category; products: Product[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const topCategories = categories.slice(0, 5);
      const results = [];
      for (const cat of topCategories) {
        try {
          const res = await catalog.getProducts({ categoryId: cat.id, limit: '10' }).catch(() => null);
          
          if (res?.items?.length) {
            results.push({ category: cat, products: res.items });
          }
        } catch {
          // ignore
        }
      }
      setCategoryData(results);
      setLoading(false);
    }
    
    if (categories.length > 0) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [categories]);

  if (loading) {
    return (
      <section className="py-20 bg-warm-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="flex gap-6 overflow-hidden">
              <div className="h-64 bg-gray-200 rounded-3xl w-[280px] shrink-0"></div>
              <div className="h-64 bg-gray-200 rounded-3xl w-[280px] shrink-0"></div>
              <div className="h-64 bg-gray-200 rounded-3xl w-[280px] shrink-0"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (categoryData.length === 0) return null;

  return (
    <section className="py-20 bg-warm-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {categoryData.map(({ category, products }) => (
          <div key={category.id} className="mb-16 last:mb-0">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-gray-900">{category.name}</h2>
                {category.description && <p className="mt-2 text-sm text-gray-500">{category.description}</p>}
              </div>
              <Link href={`/products?category=${category.id}`} className="hidden sm:flex text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors items-center gap-1">
                View All <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            
            <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex overflow-x-auto gap-6 pb-6 pt-2 hide-scrollbar snap-x snap-mandatory">
                {products.map((product) => (
                  <div key={product.id} className="w-[280px] sm:w-[320px] flex-none snap-start">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 sm:hidden flex justify-center">
              <Link href={`/products?category=${category.id}`} className="text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors items-center gap-1 inline-flex">
                View All {category.name} <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
