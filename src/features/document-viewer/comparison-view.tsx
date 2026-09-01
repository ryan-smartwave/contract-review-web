import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { Comparison, ComparisonChange } from '@/types/api';
import { segment } from './segment';

const kindTones = { added: 'success', removed: 'danger', modified: 'warning' } as const;

export function ChangeCard({ change }: { change: ComparisonChange }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{change.clause}</p>
        <Badge tone={kindTones[change.kind]}>{change.kind}</Badge>
      </div>
      {change.before_text && (
        <p className="text-sm text-text-muted line-through">{change.before_text}</p>
      )}
      {change.after_text && <p className="text-sm">{change.after_text}</p>}
      <p className="text-xs text-text-muted">{change.note}</p>
    </Card>
  );
}

export function ComparisonText({ text, comparison }: { text: string; comparison: Comparison | null }) {
  if (!comparison) return <p className="text-sm text-text-muted">Loading comparison…</p>;
  if (comparison.status === 'pending')
    return <p className="text-sm text-text-muted">Comparison in progress…</p>;
  if (comparison.status === 'no_match')
    return (
      <EmptyState
        title="No similar contract found"
        description="There is nothing in the database to compare this document against."
      />
    );
  if (comparison.status === 'failed')
    return (
      <EmptyState
        title="Comparison unavailable"
        description="Something went wrong while comparing this document to prior versions."
      />
    );
  const anchored = comparison.changes
    .filter((c) => (c.kind === 'added' || c.kind === 'modified') && c.after_text)
    .sort((a, b) => (b.after_text as string).length - (a.after_text as string).length);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold">
          Compared with {comparison.matched_document?.filename}
          {comparison.matched_document &&
            ` · ${new Date(comparison.matched_document.detected_at).toLocaleDateString()}`}
        </p>
        {comparison.summary && <p className="mt-1 text-sm text-text-muted">{comparison.summary}</p>}
      </div>
      <Card className="px-8 py-10 font-serif text-[15px] leading-7 sm:px-12">
        {text.split(/\n{2,}/).map((paragraph, i) => (
          <p key={i} className={i > 0 ? 'mt-4' : ''}>
            {segment(paragraph, anchored, (c) => c.after_text as string).map((seg, j) =>
              typeof seg === 'string' ? (
                <span key={j}>{seg}</span>
              ) : (
                <ins
                  key={j}
                  className="rounded bg-success/10 px-0.5 text-success decoration-success/60"
                >
                  {seg.item.after_text}
                </ins>
              ),
            )}
          </p>
        ))}
      </Card>
    </div>
  );
}
