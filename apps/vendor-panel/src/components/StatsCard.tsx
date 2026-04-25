import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  gradient?: string;
  className?: string;
}

export default function StatsCard({ title, value, subtitle, icon, trend, gradient, className = '' }: StatsCardProps) {
  const wrapperClass = gradient
    ? `rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ${gradient} ${className}`
    : `rounded-2xl border border-gray-100/60 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 ${className}`;

  const textColor = gradient ? 'text-white' : 'text-gray-900';
  const subtextColor = gradient ? 'text-white/70' : 'text-gray-500';
  const trendPositiveColor = gradient ? 'text-white/90' : 'text-emerald-600';
  const trendNegativeColor = gradient ? 'text-white/90' : 'text-red-600';
  const iconBg = gradient ? 'bg-white/20' : 'bg-brand-50';
  const iconColor = gradient ? 'text-white' : 'text-brand-600';

  return (
    <div className={wrapperClass}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${subtextColor}`}>{title}</p>
          <p className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</p>
          {subtitle && (
            <p className={`mt-1 text-xs ${subtextColor}`}>{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend.isPositive ? (gradient ? 'bg-white/20 text-white/90' : 'bg-emerald-50 text-emerald-600') : (gradient ? 'bg-white/20 text-white/90' : 'bg-red-50 text-red-600')}`}>
              {trend.isPositive ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                </svg>
              )}
              {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        {icon && (
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg} ${iconColor}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
