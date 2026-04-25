'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface HomeSlide {
  id: string;
  imageUrl: string;
  type: 'category' | 'product';
  targetId: string;
}

export default function HomeSlideshow({ slidesString }: { slidesString?: string }) {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slidesString) return;
    try {
      const parsed = JSON.parse(slidesString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSlides(parsed.filter(s => s.imageUrl));
      }
    } catch {
      // ignore
    }
  }, [slidesString]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || slides.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index)) {
            setCurrentIndex(index);
          }
        }
      });
    }, {
      root: container,
      threshold: 0.5
    });

    Array.from(container.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;
    
    const interval = setInterval(() => {
      if (currentIndex >= slides.length) {
        // We reached the second set. Silently jump back to the identical slide in the first set.
        const jumpTarget = currentIndex - slides.length;
        scrollToSlide(jumpTarget, 'auto');
        
        // Wait a brief moment for the instant jump to apply, then scroll to the next slide smoothly
        setTimeout(() => {
          scrollToSlide(jumpTarget + 1, 'smooth');
        }, 50);
        return;
      }
      
      scrollToSlide(currentIndex + 1, 'smooth');
    }, 4000);
    
    return () => clearInterval(interval);
  }, [slides.length, isHovered, currentIndex]);

  const scrollToSlide = (idx: number, behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const slideElements = container.children;
      const target = slideElements[idx] as HTMLElement;
      if (target) {
        container.scrollTo({
          left: target.offsetLeft - container.clientWidth / 2 + target.clientWidth / 2,
          behavior
        });
      }
    }
  };

  if (slides.length === 0) return null;

  const loopedSlides = [...slides, ...slides];

  return (
    <section className="py-8 md:py-12 bg-white relative overflow-hidden">
      <div className="w-full mx-auto">
        <div 
          className="relative group w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <div 
            ref={scrollContainerRef}
            className="relative flex w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing px-[5%] md:px-[15%] py-4 gap-4"
          >
            {loopedSlides.map((slide, idx) => (
              <Link 
                key={`${slide.id}-${idx}`}
                data-index={idx}
                href={`/${slide.type === 'category' ? 'products?category=' : 'products/'}${slide.targetId}`}
                className={`shrink-0 w-full flex-none snap-center relative block rounded-2xl md:rounded-3xl overflow-hidden shadow-lg aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] transition-all duration-500 ease-out ${idx === currentIndex ? 'scale-100 opacity-100' : 'scale-[0.95] opacity-60'}`}
              >
                <img src={slide.imageUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
              </Link>
            ))}
          </div>
          
          {slides.length > 1 && (
            <div className="hidden md:flex absolute bottom-8 left-0 right-0 z-20 justify-center gap-3">
              {slides.map((_, originalIdx) => {
                const isActive = (currentIndex % slides.length) === originalIdx;
                return (
                  <button 
                    key={originalIdx}
                    onClick={() => scrollToSlide(originalIdx, 'smooth')}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ${isActive ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/90'}`}
                    aria-label={`Go to slide ${originalIdx + 1}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
