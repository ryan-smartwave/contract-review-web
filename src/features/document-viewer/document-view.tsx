'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { applySuggestion, getDocument, rejectSuggestion, versionFileUrl } from '@/lib/api';
import type { DocumentDetail, Suggestion } from '@/types/api';
import { SuggestionCard } from './suggestion-card';

// pdf.js touches browser-only globals; never render this on the server
const OriginalDocument = dynamic(() => import('./original-document'), {
  ssr: false,
  loading: () => <p className="text-sm text-text-muted">Rendering document…</p>,
});

type Segment = string | { suggestion: Suggestion };

function segment(text: string, pending: Suggestion[]): Segment[] {
  let segments: Segment[] = [text];
  for (const suggestion of pending) {
    segments = segments.flatMap((seg) => {
      if (typeof seg !== 'string' || !seg.includes(suggestion.original_text)) return [seg];
      const [before, ...rest] = seg.split(suggestion.original_text);
      return [before, { suggestion }, rest.join(suggestion.original_text)];
    });
  }
  return segments;
}

function redline(text: string, pending: Suggestion[]) {
  return segment(text, pending).map((seg, i) =>
    typeof seg === 'string' ? (
      <span key={i}>{seg}</span>
    ) : (
      <span key={i}>
        <del className="rounded bg-danger/10 px-0.5 text-danger decoration-danger/60">
          {seg.suggestion.original_text}
        </del>{' '}
        <ins className="rounded bg-success/10 px-0.5 text-success decoration-success/60">
          {seg.suggestion.replacement_text}
        </ins>
      </span>
    ),
  );
}

function isTitle(paragraph: string) {
  return paragraph.length < 80 && /[A-Z]/.test(paragraph) && paragraph === paragraph.toUpperCase();
}

export function DocumentView({ documentId }: { documentId: number }) {
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'review' | 'original'>('review');

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

  const pending = detail.suggestions
    .filter((s) => s.status === 'pending')
    .sort((a, b) => b.original_text.length - a.original_text.length);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{detail.filename}</h1>
        {detail.review_seconds !== null && (
          <Badge tone="success">redlines ready in {Math.round(detail.review_seconds)}s</Badge>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-1 border-b border-border" role="tablist">
        {([['review', 'Review'], ['original', 'Original document']] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        {tab === 'review' ? (
          <Card className="px-8 py-10 font-serif text-[15px] leading-7 sm:px-12">
            {detail.text
              ? detail.text.split(/\n{2,}/).map((paragraph, i) => (
                  <p
                    key={i}
                    data-doc-paragraph
                    className={`${i > 0 ? 'mt-4' : ''} ${
                      isTitle(paragraph) ? 'text-center font-semibold tracking-wide' : ''
                    }`}
                  >
                    {redline(paragraph, pending)}
                  </p>
                ))
              : 'No text extracted for this document.'}
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <OriginalDocument documentId={detail.id} mimeType={detail.mime_type} />
          </Card>
        )}
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
                {v.filename ? (
                  <>
                    <a
                      href={versionFileUrl(detail.id, v.version_number)}
                      download
                      className="text-primary hover:underline"
                    >
                      {v.filename}
                    </a>{' '}
                  </>
                ) : null}
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
