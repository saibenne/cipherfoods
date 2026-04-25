'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  image?: string;
  productCount?: number;
}

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const secondSetFirstItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (categories.length <= 1 || isHovered) return;
    
    let animationFrameId: number;
    const container = scrollContainerRef.current;
    
    const scroll = () => {
      if (container && firstItemRef.current && secondSetFirstItemRef.current) {
        container.scrollLeft += 1;
        
        const offset = secondSetFirstItemRef.current.offsetLeft - firstItemRef.current.offsetLeft;
        if (container.scrollLeft >= offset) {
          container.scrollLeft -= offset;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };
    
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [categories.length, isHovered]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="relative mt-12 group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <button 
        onClick={scrollLeft}
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 text-gray-600 hover:text-brand-600 hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100"
        aria-label="Scroll left"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <div 
        ref={scrollContainerRef}
        className="relative overflow-x-auto pb-6 hide-scrollbar cursor-grab active:cursor-grabbing"
      >
        <div className="flex gap-8 w-max px-4">
          {[...categories, ...categories, ...categories].map((cat, index) => (
            <Link
              key={`${cat.id}-${index}`}
              ref={index === 0 ? firstItemRef : index === categories.length ? secondSetFirstItemRef : null}
              href={`/products?category=${cat.id}`}
              className="group flex flex-col items-center flex-none w-32 sm:w-40"
            >
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-warm-100 border-4 border-white shadow-md flex items-center justify-center text-5xl group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 group-hover:border-brand-200 overflow-hidden">
                {cat.imageUrl || cat.image ? (
                  <img src={cat.imageUrl || cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <span className="group-hover:scale-110 transition-transform duration-300">🌿</span>
                )}
              </div>
              <h3 className="mt-5 text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors whitespace-normal text-center leading-tight">{cat.name}</h3>
              {cat.productCount !== undefined && (
                <p className="mt-1 text-xs font-medium text-gray-400">{cat.productCount} Items</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      <button 
        onClick={scrollRight}
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 text-gray-600 hover:text-brand-600 hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100"
        aria-label="Scroll right"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}
