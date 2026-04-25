'use client';

import { useState } from 'react';

interface StarRatingProps {
  rating?: number;
  value?: number;
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

function StarIcon({ filled, half, className }: { filled: boolean; half?: boolean; className: string }) {
  if (half) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="half-star">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="url(#half-star)"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function StarRating({
  rating: ratingProp,
  value,
  maxStars = 5,
  interactive = false,
  onChange,
  size = 'md',
  showValue = false,
}: StarRatingProps) {
  const rating = ratingProp ?? value ?? 0;
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex" role={interactive ? 'radiogroup' : 'img'} aria-label={`Rating: ${rating} out of ${maxStars}`}>
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const filled = displayRating >= starValue;
          const half = !filled && displayRating >= starValue - 0.5;

          if (interactive) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange?.(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                className={`${filled || half ? 'text-yellow-400' : 'text-gray-300'} transition-colors hover:text-yellow-400`}
                aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
              >
                <StarIcon filled={filled} half={half} className={sizeMap[size]} />
              </button>
            );
          }

          return (
            <span key={i} className={filled || half ? 'text-yellow-400' : 'text-gray-300'}>
              <StarIcon filled={filled} half={half} className={sizeMap[size]} />
            </span>
          );
        })}
      </div>
      {showValue && <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>}
    </div>
  );
}
