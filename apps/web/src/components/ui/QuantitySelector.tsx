'use client';

interface QuantitySelectorProps {
  quantity?: number;
  value?: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function QuantitySelector({
  quantity: quantityProp,
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = 'md',
}: QuantitySelectorProps) {
  const quantity = quantityProp ?? value ?? min;
  const btnClass = size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-2 text-sm';

  const valueClass = size === 'sm'
    ? 'min-w-[1.75rem] text-xs'
    : 'min-w-[2.5rem] text-sm';

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={disabled || quantity <= min}
        className={`${btnClass} font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Decrease quantity"
      >
        <svg className="mx-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </button>
      <span className={`${valueClass} select-none text-center font-semibold text-gray-900`}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={disabled || quantity >= max}
        className={`${btnClass} font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        <svg className="mx-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
