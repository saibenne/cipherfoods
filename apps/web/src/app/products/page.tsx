'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { catalog, type Product, type Category, type ProductsResponse } from '@/lib/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Popular' },
];

const PRICE_RANGES = [
  { label: 'Under ₹100', min: 0, max: 100 },
  { label: '₹100 – ₹300', min: 100, max: 300 },
  { label: '₹300 – ₹500', min: 300, max: 500 },
  { label: '₹500 – ₹1000', min: 500, max: 1000 },
  { label: 'Above ₹1000', min: 1000, max: 99999 },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Read filters from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentSort = searchParams.get('sort') || 'newest';
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentRating = searchParams.get('rating') || '';

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (!updates.page) params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  }, [searchParams, router]);

  useEffect(() => {
    catalog.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {
      page: currentPage.toString(),
      limit: '12',
    };
    // Map frontend sort values to API sortBy/sortOrder enums
    if (currentSort) {
      const sortMap: Record<string, { sortBy: string; sortOrder: string }> = {
        newest: { sortBy: 'createdAt', sortOrder: 'DESC' },
        price_low: { sortBy: 'basePrice', sortOrder: 'ASC' },
        price_high: { sortBy: 'basePrice', sortOrder: 'DESC' },
        rating: { sortBy: 'averageRating', sortOrder: 'DESC' },
        popular: { sortBy: 'averageRating', sortOrder: 'DESC' },
      };
      const mapped = sortMap[currentSort];
      if (mapped) {
        params.sortBy = mapped.sortBy;
        params.sortOrder = mapped.sortOrder;
      }
    }

    if (currentCategory) params.categoryId = currentCategory;
    if (currentSearch) params.search = currentSearch;
    if (currentMinPrice) params.minPrice = currentMinPrice;
    if (currentMaxPrice) params.maxPrice = currentMaxPrice;
    // minRating is not supported by the API — omitted

    catalog.getProducts(params)
      .then((res: ProductsResponse) => {
        setProducts(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [currentPage, currentSort, currentCategory, currentSearch, currentMinPrice, currentMaxPrice, currentRating]);

  const clearAllFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters = currentCategory || currentMinPrice || currentMaxPrice || currentRating;

  const FilterSidebar = ({ className = '' }: { className?: string }) => (
    <aside className={className}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="text-sm text-brand-600 hover:text-brand-700">
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
        <ul className="mt-2 space-y-1">
          <li>
            <button
              onClick={() => updateFilters({ category: '' })}
              className={`block w-full rounded-xl px-4 py-2 text-left text-sm transition-colors ${
                !currentCategory ? 'bg-gradient-to-r from-brand-50 to-brand-100/50 font-semibold text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => updateFilters({ category: cat.slug })}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-sm transition-colors ${
                  currentCategory === cat.slug ? 'bg-gradient-to-r from-brand-50 to-brand-100/50 font-semibold text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{cat.name}</span>
                {cat.productCount != null && (
                  <span className="text-xs text-gray-400">{cat.productCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>
        <ul className="mt-2 space-y-1">
          {PRICE_RANGES.map((range) => {
            const active = currentMinPrice === String(range.min) && currentMaxPrice === String(range.max);
            return (
              <li key={range.label}>
                <button
                  onClick={() =>
                    updateFilters(
                      active
                        ? { minPrice: '', maxPrice: '' }
                        : { minPrice: String(range.min), maxPrice: String(range.max) }
                    )
                  }
                  className={`block w-full rounded-xl px-4 py-2 text-left text-sm transition-colors ${
                    active ? 'bg-gradient-to-r from-brand-50 to-brand-100/50 font-semibold text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Rating */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">Customer Rating</h3>
        <ul className="mt-2 space-y-1">
          {[4, 3, 2].map((r) => (
            <li key={r}>
              <button
                onClick={() => updateFilters({ rating: currentRating === String(r) ? '' : String(r) })}
                className={`flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm transition-colors ${
                  currentRating === String(r) ? 'bg-gradient-to-r from-brand-50 to-brand-100/50 font-semibold text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`h-3.5 w-3.5 ${i < r ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </span>
                <span>{r}+ & above</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Products' }]} />

      {/* Search Header */}
      {currentSearch && (
        <p className="mt-2 text-gray-600">
          Showing results for <span className="font-semibold text-gray-900">&ldquo;{currentSearch}&rdquo;</span>
        </p>
      )}

      <div className="mt-6 flex gap-8">
        {/* Desktop Sidebar */}
        <FilterSidebar className="hidden w-56 shrink-0 lg:block" />

        {/* Product Grid Area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100/60 bg-white/80 backdrop-blur shadow-sm p-4">
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 lg:hidden"
                aria-label="Open filters"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${total} product${total !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-by" className="text-sm text-gray-500">Sort by:</label>
              <select
                id="sort-by"
                value={currentSort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="rounded-xl border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {currentCategory && (
                <span className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-brand-50 to-brand-100/50 px-4 py-1.5 text-sm text-brand-700">
                  {categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
                  <button onClick={() => updateFilters({ category: '' })} className="ml-1 hover:text-brand-900" aria-label="Remove category filter">×</button>
                </span>
              )}
              {currentMinPrice && currentMaxPrice && (
                <span className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-brand-50 to-brand-100/50 px-4 py-1.5 text-sm text-brand-700">
                  ₹{currentMinPrice} – ₹{currentMaxPrice}
                  <button onClick={() => updateFilters({ minPrice: '', maxPrice: '' })} className="ml-1 hover:text-brand-900" aria-label="Remove price filter">×</button>
                </span>
              )}
              {currentRating && (
               <span className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-brand-50 to-brand-100/50 px-4 py-1.5 text-sm text-brand-700">
                  {currentRating}★ & above
                  <button onClick={() => updateFilters({ rating: '' })} className="ml-1 hover:text-brand-900" aria-label="Remove rating filter">×</button>
                </span>
              )}
            </div>
          )}

          {/* Pill Tabs Above Grid */}
          <div className="mt-6 mb-2 flex overflow-x-auto gap-2 pb-3">
            <button
              onClick={() => updateFilters({ category: '' })}
              className={`pill-tab whitespace-nowrap flex-shrink-0 ${!currentCategory ? 'pill-tab-active' : ''}`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilters({ category: cat.slug })}
                className={`pill-tab whitespace-nowrap flex-shrink-0 ${currentCategory === cat.slug ? 'pill-tab-active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="mt-12">
              <EmptyState
                icon={
                  <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                title="No products found"
                description="Try adjusting your filters or search term"
                action={
                  hasActiveFilters
                    ? { label: 'Clear all filters', onClick: clearAllFilters }
                    : { label: 'Browse all products', href: '/products' }
                }
              />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Page navigation">
              <button
                onClick={() => updateFilters({ page: String(currentPage - 1) })}
                disabled={currentPage <= 1}
                className="rounded-xl border border-gray-300 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => updateFilters({ page: String(p) })}
                      className={`min-w-[2.25rem] rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        p === currentPage
                          ? 'bg-gradient-to-r from-brand-600 to-brand-700 shadow-md text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => updateFilters({ page: String(currentPage + 1) })}
                disabled={currentPage >= totalPages}
                className="rounded-xl border border-gray-300 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
                aria-label="Next page"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 w-80 overflow-y-auto bg-white/95 backdrop-blur-xl rounded-r-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-gray-900">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close filters">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterSidebar className="mt-4" />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
