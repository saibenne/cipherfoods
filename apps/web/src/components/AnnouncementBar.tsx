'use client';

import { useState } from 'react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-earth-500 via-brand-600 to-earth-500 text-white overflow-hidden py-2">
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
          aria-label="Close announcement"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex whitespace-nowrap animate-marquee items-center text-xs sm:text-sm font-semibold tracking-wide">
        <span className="mx-4">🌿 NEW PRODUCTS POSTED EVERY 09:30 PM</span>
        <span className="mx-4 text-earth-200">✦</span>
        <span className="mx-4">🚚 FREE DELIVERY ON FIRST 3 ORDERS</span>
        <span className="mx-4 text-earth-200">✦</span>
        <span className="mx-4">🌿 100% ORGANIC TELANGANA PRODUCE</span>
        <span className="mx-4 text-earth-200">✦</span>
        {/* Repeat for seamless marquee */}
        <span className="mx-4">🌿 NEW PRODUCTS POSTED EVERY 09:30 PM</span>
        <span className="mx-4 text-earth-200">✦</span>
        <span className="mx-4">🚚 FREE DELIVERY ON FIRST 3 ORDERS</span>
        <span className="mx-4 text-earth-200">✦</span>
        <span className="mx-4">🌿 100% ORGANIC TELANGANA PRODUCE</span>
        <span className="mx-4 text-earth-200">✦</span>
      </div>
    </div>
  );
}
