import Link from 'next/link';
import TrendingProducts from '@/components/TrendingProducts';
import CategoryProducts from '@/components/CategoryProducts';
import CategoryCarousel from '@/components/CategoryCarousel';
import HomeSlideshow from '@/components/HomeSlideshow';
import { catalog, promotions, config, formatPrice, type Category, type Promotion } from '@/lib/api';
import { Client } from 'pg';

async function getCategories(): Promise<Category[]> {
  try {
    return await catalog.getCategories();
  } catch {
    return [];
  }
}

async function getActivePromotions(): Promise<Promotion[]> {
  try {
    return await promotions.getActive();
  } catch {
    return [];
  }
}

async function getHomeSlideshow(): Promise<string | null> {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'your_db_password',
    database: 'cipherfoods',
  });
  try {
    await client.connect();
    const res = await client.query('SELECT value FROM admin.platform_config WHERE key = $1', ['homeSlideshow']);
    return res.rows[0]?.value || null;
  } catch (err) {
    return null;
  } finally {
    await client.end();
  }
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, activePromotions, publicConfig, slideshowConfig] = await Promise.all([
    getCategories(),
    getActivePromotions(),
    config.getPublic().catch(() => ({})),
    getHomeSlideshow(),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-warm-50 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16">
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left flex flex-col justify-center">
              <div className="animate-fade-in-up">
                <p className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-700 bg-brand-100 shadow-sm border border-brand-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                  Farm to Table • Telangana
                </p>
                <p className="mt-6 font-accent text-3xl text-earth-600 -rotate-2">We Introduce</p>
                <h1 className="mt-2 font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                  Farm Fresh to{' '}
                  <span className="text-brand-600 block mt-2">
                    Your Doorstep
                  </span>
                </h1>
                <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                  Discover authentic Telangana spices, grains, pickles, and sweets.
                  Organic food grown without the use of synthetic chemicals, straight from our farmers.
                </p>
                <div className="mt-10 flex flex-wrap gap-4 sm:justify-center lg:justify-start">
                  <Link href="/products" className="btn-primary px-8 py-4 text-base rounded-full shadow-lg hover:shadow-brand-500/30">
                    Shop Now
                  </Link>
                  <Link href="/about" className="btn-secondary px-8 py-4 text-base rounded-full border-2 bg-transparent hover:bg-white">
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative mt-16 sm:mx-auto sm:max-w-lg lg:col-span-6 lg:mx-0 lg:mt-0 lg:flex lg:max-w-none lg:items-center">
              <div className="relative mx-auto w-full aspect-square rounded-full bg-forest-200 p-2 overflow-visible">
                <div className="absolute inset-0 bg-brand-400 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
                <div className="w-full h-full rounded-full overflow-hidden border-8 border-white shadow-2xl relative z-10 bg-white flex items-center justify-center">
                  {publicConfig.heroVideoUrl ? (
                    <video 
                      src={publicConfig.heroVideoUrl} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-forest-50/30">
                       <span className="text-brand-600 text-6xl">🥗</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-gradient-to-r from-brand-50/80 to-cream-50/80 backdrop-blur border-y border-brand-100/30 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { icon: (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>), title: '100% Organic', desc: 'Chemical-free produce' },
              { icon: (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>), title: 'Farm Direct', desc: 'No middlemen' },
              { icon: (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>), title: 'Same Day Delivery', desc: 'Fresh at your door' },
              { icon: (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>), title: 'Secure Payments', desc: 'SSL encrypted' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 sm:[&:not(:last-child)]:border-r sm:border-brand-100/40 sm:pr-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm text-brand-600">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {categories.length > 0 && (
        <section className="py-20 bg-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900">Shop by Category</h2>
            <p className="mt-3 text-sm text-gray-500 max-w-2xl mx-auto">Explore our wide selection of farm-fresh produce and traditional foods.</p>
            <CategoryCarousel categories={categories} />
          </div>
        </section>
      )}

      {/* Active Promotions */}
      {activePromotions.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-gray-900">Offers & Deals</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activePromotions.slice(0, 3).map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-3xl overflow-hidden bg-gradient-to-br from-earth-50 via-cream-50 to-brand-50 p-8 ring-1 ring-earth-100/60 hover:shadow-xl hover:ring-brand-200 transition-all duration-300"
                >
                  <p className="text-lg font-bold text-brand-800">{promo.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{promo.description}</p>
                  {promo.code && (
                    <div className="mt-4">
                      <span className="rounded-xl border-2 border-dashed border-brand-400 bg-white/80 backdrop-blur px-4 py-2 font-mono text-base font-bold text-brand-700">
                        {promo.code}
                      </span>
                    </div>
                  )}
                  <p className="mt-3 text-sm font-semibold text-brand-700">
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}% OFF`
                      : `${formatPrice(promo.discountValue)} OFF`}
                    {promo.minOrderValue ? ` on orders above ${formatPrice(promo.minOrderValue)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Home Slideshow */}
      <HomeSlideshow slidesString={slideshowConfig || undefined} />

      {/* Trending Products */}
      <TrendingProducts />

      {/* Category-wise Products */}
      <CategoryProducts categories={categories} />

      {/* Who We Are */}
      <section className="bg-warm-50 py-24 border-t border-earth-100/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="font-accent text-3xl text-earth-600">About Us</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-gray-900">Who We Are</h2>
            <p className="mt-4 text-base text-gray-600">
              Is organic food really healthier? Is it worth the expense? Find out what the labels mean and which foods give you the most bang for your buck.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Natural Farm', desc: 'Organic farming practices may reduce pollution, conserve water, reduce soil erosion.', icon: '🌱' },
              { title: 'Healthy Food', desc: 'The healthy food benefit is like having free food credit it\'s Strong bones and teeth.', icon: '🍎' },
              { title: 'Conserves Biodiversity', desc: 'Biodiversity supports food security and sustained livelihoods genetic diversity.', icon: '🦋' },
              { title: 'Biologically Safe', desc: 'Biosafety is used to protects from harmful incidents employs ongoing risk management.', icon: '🛡️' },
            ].map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-forest-100 shadow-sm border-4 border-white transition-transform duration-500 group-hover:scale-110">
                  <span className="text-5xl">{item.icon}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download Banner */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2.5rem] bg-gradient-to-r from-brand-600 to-brand-500 overflow-hidden shadow-2xl relative">
            <div className="absolute right-0 bottom-0 w-1/3 h-full opacity-20 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="px-8 py-16 sm:px-16 sm:py-20 lg:flex lg:items-center lg:justify-between lg:pr-32">
              <div className="max-w-xl text-white">
                <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
                  Make your online shop easier with our mobile app
                </h2>
                <p className="mt-6 text-lg text-brand-50 leading-relaxed">
                  CipherFoods makes online grocery shopping fast and easy. Get groceries delivered and order the best of seasonal farm fresh food.
                </p>
                <div className="mt-10 flex gap-4">
                  <button className="flex items-center gap-3 rounded-xl bg-black px-6 py-3 text-white hover:bg-gray-900 transition-colors">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341c-.021-3.567 2.92-5.289 3.053-5.367-1.656-2.422-4.225-2.76-5.143-2.8-2.188-.221-4.27 1.288-5.385 1.288-1.114 0-2.836-1.258-4.636-1.222-2.339.034-4.502 1.358-5.706 3.444-2.43 4.214-.622 10.453 1.748 13.87 1.157 1.668 2.529 3.535 4.301 3.47 1.71-.065 2.364-1.101 4.436-1.101 2.072 0 2.684 1.101 4.475 1.066 1.834-.035 3.024-1.701 4.144-3.337 1.296-1.892 1.829-3.725 1.854-3.82-.039-.015-3.486-1.336-3.486-5.467M12.012 7.025c.937-1.135 1.568-2.712 1.398-4.286-1.358.055-3.033.904-3.999 2.036-.856.992-1.603 2.607-1.396 4.144 1.515.117 3.061-.758 3.997-1.894"/></svg>
                    <div className="text-left">
                      <div className="text-[10px] font-medium opacity-80">Download on the</div>
                      <div className="text-sm font-bold">App Store</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 rounded-xl bg-black px-6 py-3 text-white hover:bg-gray-900 transition-colors">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186c-.165-.152-.284-.361-.336-.596L3 20.82V3.18c.052-.235.171-.444.336-.596l.273-.77zM14.54 12.748l2.946 2.946-12.001 6.928 9.055-9.874zM15.286 12l2.365-2.365 2.903 1.676c1.173.677 1.173 1.781 0 2.458l-2.903 1.676-2.365-2.365zM14.54 11.252L5.485 1.378l12.001 6.928-2.946 2.946z"/></svg>
                    <div className="text-left">
                      <div className="text-[10px] font-medium opacity-80">GET IT ON</div>
                      <div className="text-sm font-bold">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="overflow-hidden py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-gray-900">What Our Customers Say</h2>
            <p className="mt-2 text-sm text-gray-500">Real reviews from happy customers</p>
          </div>
        </div>
        <div className="relative mt-10 overflow-hidden">
          <div className="testimonial-scroll flex gap-6 px-4">
            {[
              { name: 'Priya Reddy', location: 'Hyderabad', text: 'The spices are incredibly fresh! You can tell the difference from store-bought. My cooking has improved so much since I started ordering from CipherFoods.', rating: 5 },
              { name: 'Ravi Kumar', location: 'Warangal', text: 'Love the same-day delivery option. The pickles taste exactly like my grandmother used to make. Authentic Telangana flavors!', rating: 5 },
              { name: 'Seetha Devi', location: 'Secunderabad', text: 'I ordered the organic rice and jaggery combo. Outstanding quality and fair prices. Supporting local farmers feels great.', rating: 4 },
              { name: 'Anil Sharma', location: 'Hyderabad', text: 'Best online platform for traditional foods. The packaging is excellent and everything arrives fresh. Highly recommended!', rating: 5 },
              { name: 'Meera Patel', location: 'Karimnagar', text: 'The millet varieties are fantastic. I appreciate how CipherFoods connects us directly with farmers. Great mission!', rating: 5 },
              { name: 'Priya Reddy', location: 'Hyderabad', text: 'The spices are incredibly fresh! You can tell the difference from store-bought. My cooking has improved so much.', rating: 5 },
              { name: 'Ravi Kumar', location: 'Warangal', text: 'Love the same-day delivery option. The pickles taste exactly like my grandmother used to make.', rating: 5 },
              { name: 'Seetha Devi', location: 'Secunderabad', text: 'Outstanding quality and fair prices. Supporting local farmers feels great.', rating: 4 },
            ].map((review, i) => (
              <div key={i} className="w-[340px] shrink-0 rounded-3xl bg-white p-8 shadow-sm border border-gray-100/60 hover:shadow-lg transition-all">
                <div className="flex text-amber-400">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <svg key={j} className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">&ldquo;{review.text}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-earth-400 text-sm font-bold text-white">{review.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                    <p className="text-xs text-gray-500">{review.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative overflow-hidden bg-earth-700 py-24 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Get Fresh Deals in Your Inbox</h2>
          <p className="mt-4 text-earth-100 max-w-2xl mx-auto">Subscribe for weekly updates on new products, seasonal offers, and farming stories.</p>
          <form
            action="#"
            className="mx-auto mt-10 flex flex-col sm:flex-row max-w-lg gap-3"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-full border-none bg-white px-6 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
            />
            <button type="submit" className="rounded-full bg-brand-600 px-8 py-4 font-bold text-white hover:bg-brand-500 transition-all duration-300 shadow-lg hover:shadow-brand-500/50">
              Subscribe
            </button>
          </form>
          <p className="mt-6 text-sm text-earth-200">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}
