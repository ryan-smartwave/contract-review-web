import { type ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-6 py-14 text-center">
      {icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text-muted">
          {icon}
        </span>
      )}
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-text-muted">{description}</p>
    </div>
  );
}
