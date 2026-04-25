import Link from 'next/link';
import { catalog, type Category } from '@/lib/api';

async function getCategories(): Promise<Category[]> {
  try {
    return await catalog.getCategories();
  } catch {
    return [];
  }
}

export const metadata = { title: 'Categories — CipherFoods' };

const CATEGORY_ICONS: Record<string, string> = {
  rice: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  spices: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  oils: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  snacks: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.75 1.75 0 003 15.546V12a9 9 0 0118 0v3.546z',
};

const FALLBACK_ICON = 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';

const CATEGORY_GRADIENTS = [
  'from-brand-100 to-brand-50',
  'from-earth-100 to-earth-50',
  'from-amber-100 to-amber-50',
  'from-emerald-100 to-emerald-50',
  'from-rose-100 to-rose-50',
  'from-sky-100 to-sky-50',
  'from-violet-100 to-violet-50',
  'from-orange-100 to-orange-50',
];

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">Browse Categories</h1>
        <p className="mt-2 text-gray-500">Explore our selection of traditional Telangana foods</p>
      </div>

      {categories.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat, index) => {
            const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
            const iconPath = CATEGORY_ICONS[cat.slug] || FALLBACK_ICON;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="group overflow-hidden rounded-3xl bg-white border border-gray-100/60 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-500 p-8"
              >
                <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center p-6`}>
                  {cat.imageUrl || cat.image ? (
                    <img src={cat.imageUrl || cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-cream-100 shadow-sm transition-transform group-hover:scale-110">
                      <svg className="h-8 w-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-display text-lg font-semibold text-gray-900 group-hover:text-brand-700">{cat.name}</h2>
                  {cat.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{cat.description}</p>
                  )}
                  {cat.productCount != null && (
                    <p className="mt-2 text-xs font-medium text-brand-600">
                      {cat.productCount} product{cat.productCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-16 rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-500">Categories coming soon!</p>
          <p className="mt-1 text-sm text-gray-400">Check back later for our curated collections</p>
        </div>
      )}
    </div>
  );
}
