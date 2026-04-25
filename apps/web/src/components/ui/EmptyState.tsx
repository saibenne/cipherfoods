import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function EmptyState({ icon, title, description, actionLabel, actionHref, onAction, action }: EmptyStateProps) {
  const label = actionLabel || action?.label;
  const href = actionHref || action?.href;
  const onClick = onAction || action?.onClick;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 px-6 py-16 text-center">
      {icon && <div className="text-5xl">{icon}</div>}
      <h3 className="mt-4 text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>}
      {label && href && (
        <Link href={href} className="btn-primary mt-6">
          {label}
        </Link>
      )}
      {label && onClick && !href && (
        <button onClick={onClick} className="btn-primary mt-6">
          {label}
        </button>
      )}
    </div>
  );
}
