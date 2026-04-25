export function ProductCardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="aspect-square bg-gray-200" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-3 w-12 rounded bg-gray-200" />
        </div>
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="card animate-pulse p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-5 w-20 rounded-full bg-gray-200" />
          <div className="h-6 w-24 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
        <div className="h-3 w-16 rounded bg-gray-200" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function LineSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}
