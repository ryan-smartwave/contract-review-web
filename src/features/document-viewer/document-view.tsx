'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { applySuggestion, getDocument, rejectSuggestion } from '@/lib/api';
import type { DocumentDetail } from '@/types/api';
import { SuggestionCard } from './suggestion-card';

function highlight(text: string, anchors: string[]) {
  let segments: (string | { mark: string })[] = [text];
  for (const anchor of anchors) {
    segments = segments.flatMap((seg) => {
      if (typeof seg !== 'string' || !seg.includes(anchor)) return [seg];
      const [before, ...rest] = seg.split(anchor);
      return [before, { mark: anchor }, rest.join(anchor)];
    });
  }
  return segments.map((seg, i) =>
    typeof seg === 'string' ? (
      <span key={i}>{seg}</span>
    ) : (
      <mark key={i} className="rounded bg-warning/20 px-0.5">{seg.mark}</mark>
    ),
  );
}

export function DocumentView({ documentId }: { documentId: number }) {
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDocument(documentId).then(setDetail).catch((e) =>
      setError(e instanceof Error ? e.message : 'Failed to load document'));
  }, [documentId]);

  const act = useCallback(async (fn: (id: number) => Promise<DocumentDetail>, id: number) => {
    setBusy(true);
    setError(null);
    try {
      setDetail(await fn(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
      setDetail(await getDocument(documentId));
    } finally {
      setBusy(false);
    }
  }, [documentId]);

  if (error && !detail) return <EmptyState title="Could not load document" description={error} />;
  if (!detail) return <p className="text-sm text-text-muted">Loading…</p>;

  const pendingAnchors = detail.suggestions
    .filter((s) => s.status === 'pending')
    .map((s) => s.original_text)
    .sort((a, b) => b.length - a.length);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{detail.filename}</h1>
        {detail.review_seconds !== null && (
          <Badge tone="success">redlines ready in {Math.round(detail.review_seconds)}s</Badge>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <Card className="whitespace-pre-wrap text-sm leading-7">
          {detail.text ? highlight(detail.text, pendingAnchors) : 'No text extracted for this document.'}
        </Card>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">Suggested redlines ({detail.suggestions.length})</p>
          {detail.suggestions.length === 0 && (
            <p className="text-sm text-text-muted">No suggestions for this document.</p>
          )}
          {detail.suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              busy={busy}
              onApply={() => act(applySuggestion, s.id)}
              onReject={() => act(rejectSuggestion, s.id)}
            />
          ))}
          <p className="mt-2 text-sm font-semibold">Versions</p>
          <ul className="flex flex-col gap-1 text-sm text-text-muted">
            {detail.versions.map((v) => (
              <li key={v.version_number}>
                v{v.version_number} · {new Date(v.created_at).toLocaleString()}
                {v.source_suggestion_id ? ` · from suggestion #${v.source_suggestion_id}` : ' · original'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
