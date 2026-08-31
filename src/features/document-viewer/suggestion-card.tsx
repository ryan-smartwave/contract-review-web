import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Suggestion } from '@/types/api';

const tones = { pending: 'warning', applied: 'success', rejected: 'neutral', stale: 'danger' } as const;

export type StagedChoice = 'accept' | 'reject' | null;

export function SuggestionCard({
  suggestion,
  busy,
  staged,
  onStage,
}: {
  suggestion: Suggestion;
  busy: boolean;
  staged: StagedChoice;
  onStage: (choice: 'accept' | 'reject') => void;
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
          <Button
            variant={staged === 'accept' ? 'primary' : 'secondary'}
            aria-pressed={staged === 'accept'}
            onClick={() => onStage('accept')}
            disabled={busy}
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            className={staged === 'reject' ? 'border-danger text-danger' : ''}
            aria-pressed={staged === 'reject'}
            onClick={() => onStage('reject')}
            disabled={busy}
          >
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
}
