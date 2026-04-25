'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useRef, useCallback } from 'react';
import { catalog, type Product } from '@/lib/api';

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89-.82M17 8c2-1 4 0 4 0s1 2 0 4c-2 4-6.39 7.26-12.07 8.17" />
      <path d="M17 8c-4 4-9.47 4.66-12 3" />
    </svg>
  );
}

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      try {
        const raw = localStorage.getItem('cart_count');
        if (raw) setCartCount(Number(raw));
      } catch { /* ignore */ }
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cart-updated', updateCount as EventListener);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cart-updated', updateCount as EventListener);
    };
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 2) { setSearchResults([]); setSearchOpen(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await catalog.getProducts({ search: q, limit: '5' });
        setSearchResults(res.items);
        setSearchOpen(true);
      } catch { setSearchResults([]); }
    }, 300);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-warm-50/95 backdrop-blur-xl border-b border-earth-100 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
            <LeafIcon className="h-7 w-7 text-brand-600 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-display font-bold text-2xl bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent">CipherFoods</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 md:flex ml-4">
            <Link href="/products?category=new" className="relative rounded-lg px-3 py-2 text-xs font-bold tracking-wider uppercase text-gray-600 transition-colors hover:text-brand-700 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:bg-brand-600 after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-3/4 after:rounded-full">New Stocks</Link>
            <Link href="/products?category=vegetables" className="relative rounded-lg px-3 py-2 text-xs font-bold tracking-wider uppercase text-gray-600 transition-colors hover:text-brand-700 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:bg-brand-600 after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-3/4 after:rounded-full">Vegetables</Link>
            <Link href="/products?category=fruits" className="relative rounded-lg px-3 py-2 text-xs font-bold tracking-wider uppercase text-gray-600 transition-colors hover:text-brand-700 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:bg-brand-600 after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-3/4 after:rounded-full">Fruits</Link>
            <Link href="/products" className="relative rounded-lg px-3 py-2 text-xs font-bold tracking-wider uppercase text-gray-600 transition-colors hover:text-brand-700 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:bg-brand-600 after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-3/4 after:rounded-full">View All</Link>
          </nav>

          <div className="hidden flex-1 items-center justify-end gap-4 md:flex mr-4">
             <Link href="/about" className="text-xs font-bold tracking-wider uppercase text-gray-600 hover:text-brand-700">About Us</Link>
             <Link href="/community" className="text-xs font-bold tracking-wider uppercase text-gray-600 hover:text-brand-700">Community</Link>
             <Link href="/contact" className="text-xs font-bold tracking-wider uppercase text-gray-600 hover:text-brand-700">Contact Us</Link>
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative mx-auto hidden w-full max-w-md md:block">
            <div className="relative group">
              <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform duration-300 group-focus-within:scale-110 group-focus-within:text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }} className="w-full rounded-full border border-earth-200 bg-white/80 backdrop-blur py-2 pl-11 pr-4 text-sm text-gray-700 transition-all duration-300 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:shadow-md" aria-label="Search products" />
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full rounded-2xl border border-gray-100/80 bg-white/95 backdrop-blur-xl py-2 shadow-xl animate-fade-in">
                {searchResults.map((p) => (
                  <Link key={p.id} href={`/products/${p.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-brand-50/50">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gray-100"><img src={p.images?.[0]?.url || '/placeholder-product.png'} alt="" className="h-full w-full object-cover" /></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.category?.name}</p></div>
                    <span className="shrink-0 text-sm font-bold text-brand-700">₹{p.basePrice}</span>
                  </Link>
                ))}
                <div className="border-t border-gray-100 px-4 py-2">
                  <Link href={`/products?search=${encodeURIComponent(searchQuery)}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-xs font-medium text-brand-700 hover:text-brand-800">View all results →</Link>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Right */}
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/wishlist" className="relative rounded-xl p-2.5 text-gray-500 transition-all duration-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-sm" aria-label="Wishlist">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
            </Link>
            <Link href="/cart" className="relative rounded-xl p-2.5 text-gray-500 transition-all duration-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-sm" aria-label="Cart">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white shadow-sm animate-pulse-slow">{cartCount > 9 ? '9+' : cartCount}</span>}
            </Link>

            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-all duration-300 hover:bg-brand-50 hover:text-brand-700" aria-expanded={userMenuOpen} aria-haspopup="true">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-earth-500 text-xs font-bold text-white ring-2 ring-white shadow-sm">{user?.name?.charAt(0).toUpperCase()}</div>
                  <span className="hidden lg:inline">{user?.name?.split(' ')[0]}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-gray-100/80 bg-white/95 backdrop-blur-xl py-2 shadow-xl animate-fade-in">
                    <div className="border-b border-gray-100 px-4 py-3"><p className="text-sm font-semibold text-gray-900">{user?.name}</p><p className="truncate text-xs text-gray-500">{user?.email}</p></div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-brand-50">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>Profile
                    </Link>
                    <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-brand-50">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>Orders
                    </Link>
                    <Link href="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-brand-50">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>Wishlist
                    </Link>
                    <Link href="/support" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-brand-50">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>Support
                    </Link>
                    <div className="border-t border-gray-100 pt-1">
                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-300 hover:bg-brand-50 hover:text-brand-700">Login</Link>
                <Link href="/auth/register" className="btn-primary !px-5 !py-2 text-xs">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden ml-auto">
            <Link href="/cart" className="relative rounded-xl p-2 text-gray-500" aria-label="Cart">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white shadow-sm animate-pulse-slow">{cartCount > 9 ? '9+' : cartCount}</span>}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-brand-50" aria-label="Toggle menu" aria-expanded={mobileOpen}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeMobile} aria-hidden="true" />
          <nav className="fixed inset-y-0 right-0 z-50 w-72 overflow-y-auto bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300" aria-label="Mobile navigation">
            <div className="flex items-center justify-between border-b border-gray-100/50 px-4 py-4">
              <div className="flex items-center gap-2">
                <LeafIcon className="h-5 w-5 text-brand-600" />
                <span className="font-display text-lg font-bold bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent">Menu</span>
              </div>
              <button onClick={closeMobile} className="rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" aria-label="Close menu"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                <input type="text" placeholder="Search products..." className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20" onKeyDown={(e) => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value; if (v.trim()) { window.location.href = `/products?search=${encodeURIComponent(v)}`; closeMobile(); } } }} aria-label="Search products" />
              </div>
            </div>
            <div className="flex flex-col px-2">
              <Link href="/products" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700">Products</Link>
              <Link href="/categories" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700">Categories</Link>
              <Link href="/wishlist" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700">Wishlist</Link>
              <div className="my-2 border-t border-gray-100/50" />
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-earth-500 text-sm font-bold text-white ring-2 ring-white shadow-sm">{user?.name?.charAt(0).toUpperCase()}</div>
                    <div><p className="text-sm font-semibold text-gray-900">{user?.name}</p><p className="text-xs text-gray-500">{user?.email}</p></div>
                  </div>
                  <Link href="/profile" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700">Profile</Link>
                  <Link href="/orders" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700">Orders</Link>
                  <Link href="/support" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700">Support</Link>
                  <div className="my-2 border-t border-gray-100/50" />
                  <button onClick={() => { logout(); closeMobile(); }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">Logout</button>
                </>
              ) : (
                <div className="space-y-2 px-3 py-3">
                  <Link href="/auth/login" onClick={closeMobile} className="btn-primary block w-full text-center text-sm">Login</Link>
                  <Link href="/auth/register" onClick={closeMobile} className="btn-secondary block w-full text-center text-sm">Create Account</Link>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
