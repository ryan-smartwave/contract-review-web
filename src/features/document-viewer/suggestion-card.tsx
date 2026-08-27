import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Suggestion } from '@/types/api';

const tones = { pending: 'warning', applied: 'success', rejected: 'neutral', stale: 'danger' } as const;

export function SuggestionCard({
  suggestion,
  busy,
  onApply,
  onReject,
}: {
  suggestion: Suggestion;
  busy: boolean;
  onApply: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{suggestion.clause}</p>
        <Badge tone={tones[suggestion.status]}>{suggestion.status}</Badge>
      </div>
      <p className="text-sm text-text-muted line-through">{suggestion.original_text}</p>
      <p className="text-sm">{suggestion.replacement_text}</p>
      <p className="text-xs text-text-muted">{suggestion.rationale}</p>
      {suggestion.status === 'pending' && (
        <div className="mt-1 flex gap-2">
          <Button onClick={onApply} disabled={busy}>Apply</Button>
          <Button variant="secondary" onClick={onReject} disabled={busy}>Reject</Button>
        </div>
      )}
    </Card>
  );
}
