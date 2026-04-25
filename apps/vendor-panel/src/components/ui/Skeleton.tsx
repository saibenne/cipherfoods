interface SkeletonLineProps {
  className?: string;
  width?: string;
}

export function SkeletonLine({ className = '', width = 'w-full' }: SkeletonLineProps) {
  return <div className={`h-4 animate-pulse rounded bg-gray-200 ${width} ${className}`} />;
}

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 animate-pulse rounded bg-gray-200 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`card overflow-hidden p-0 ${className}`}>
      <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 flex-1 animate-pulse rounded bg-gray-300" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 border-b border-gray-100 px-4 py-4 last:border-0">
          {Array.from({ length: columns }).map((_, ci) => (
            <div key={ci} className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      ))}
    </div>
  );
}
