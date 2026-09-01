'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { confirmSuggestions, getComparison, getDocument, versionFileUrl } from '@/lib/api';
import type { Comparison, DocumentDetail, Suggestion } from '@/types/api';
import { SuggestionCard, type StagedChoice } from './suggestion-card';
import { ChangeCard, ComparisonText } from './comparison-view';
import { INS_HIGHLIGHT_CLASS, segment } from './segment';

// pdf.js touches browser-only globals; never render this on the server
const OriginalDocument = dynamic(() => import('./original-document'), {
  ssr: false,
  loading: () => <p className="text-sm text-text-muted">Rendering document…</p>,
});

function redline(text: string, pending: Suggestion[]) {
  return segment(text, pending, (s) => s.original_text).map((seg, i) =>
    typeof seg === 'string' ? (
      <span key={i}>{seg}</span>
    ) : (
      <span key={i}>
        <del className="rounded bg-danger/10 px-0.5 text-danger decoration-danger/60">
          {seg.item.original_text}
        </del>{' '}
        <ins className={INS_HIGHLIGHT_CLASS}>
          {seg.item.replacement_text}
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
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<'review' | 'original' | 'comparison'>('review');
  const [staged, setStaged] = useState<Record<number, Exclude<StagedChoice, null>>>({});
  const [comparisonData, setComparisonData] = useState<Comparison | null>(null);

  useEffect(() => {
    getDocument(documentId).then(setDetail).catch((e) =>
      setError(e instanceof Error ? e.message : 'Failed to load document'));
  }, [documentId]);

  const stage = useCallback((id: number, choice: 'accept' | 'reject') => {
    setStaged((prev) => {
      const next = { ...prev };
      if (next[id] === choice) delete next[id];
      else next[id] = choice;
      return next;
    });
  }, []);

  const stagedEntries = Object.entries(staged);

  const openTab = useCallback((key: 'review' | 'original' | 'comparison') => {
    setTab(key);
    if (key === 'comparison' && comparisonData === null) {
      getComparison(documentId)
        .then(setComparisonData)
        .catch(() => setComparisonData({ status: 'failed', matched_document: null, summary: null, changes: [] }));
    }
  }, [comparisonData, documentId]);

  const confirm = useCallback(async () => {
    const appliedIds = Object.entries(staged).filter(([, c]) => c === 'accept').map(([id]) => Number(id));
    const rejectedIds = Object.entries(staged).filter(([, c]) => c === 'reject').map(([id]) => Number(id));
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const fresh = await confirmSuggestions(documentId, appliedIds, rejectedIds);
      setDetail(fresh);
      setStaged({});
      const staleCount = appliedIds.filter((id) =>
        fresh.suggestions.some((s) => s.id === id && s.status === 'stale'),
      ).length;
      if (staleCount > 0) {
        setNotice(
          `${staleCount} accepted change${staleCount === 1 ? '' : 's'} could not be applied because the document text had changed.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
      try {
        const fresh = await getDocument(documentId);
        setDetail(fresh);
        // drop staged decisions for suggestions actioned elsewhere, so a
        // retry doesn't resend ids the server will always refuse
        setStaged((prev) =>
          Object.fromEntries(
            Object.entries(prev).filter(([id]) =>
              fresh.suggestions.some((s) => s.id === Number(id) && s.status === 'pending'),
            ),
          ),
        );
      } catch {
        // refetch failed too — keep the current view, the error is already shown
      }
    } finally {
      setBusy(false);
    }
  }, [documentId, staged]);

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
      {notice && <p className="text-sm text-warning">{notice}</p>}
      <div className="flex gap-1 border-b border-border" role="tablist">
        {(
          [
            ['review', 'Review'],
            ['original', 'Original document'],
            ...(detail.is_contract_revision ? [['comparison', 'Compared with prior'] as const] : []),
          ] satisfies Array<readonly ['review' | 'original' | 'comparison', string]>
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => openTab(key)}
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
        {tab === 'comparison' ? (
          <ComparisonText text={detail.text} comparison={comparisonData} />
        ) : tab === 'review' ? (
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
          {tab !== 'comparison' && (
            <>
              <p className="text-sm font-semibold">Suggested redlines ({detail.suggestions.length})</p>
              {detail.suggestions.length === 0 && (
                <p className="text-sm text-text-muted">No suggestions for this document.</p>
              )}
              {detail.suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  busy={busy}
                  staged={staged[s.id] ?? null}
                  onStage={(choice) => stage(s.id, choice)}
                />
              ))}
              {stagedEntries.length > 0 && (
                <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-3 shadow-md">
                  <p className="text-sm text-text-muted">
                    {stagedEntries.filter(([, c]) => c === 'accept').length} accepted ·{' '}
                    {stagedEntries.filter(([, c]) => c === 'reject').length} rejected
                  </p>
                  <Button onClick={confirm} disabled={busy}>
                    Confirm &amp; save ({stagedEntries.length})
                  </Button>
                </div>
              )}
            </>
          )}
          {tab === 'comparison' && comparisonData?.status === 'ready' && (
            <>
              <p className="text-sm font-semibold">Changes vs prior ({comparisonData.changes.length})</p>
              {comparisonData.changes.length === 0 && (
                <p className="text-sm text-text-muted">No verifiable changes to highlight.</p>
              )}
              {comparisonData.changes.map((c, i) => (
                <ChangeCard key={i} change={c} />
              ))}
            </>
          )}
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
                {v.source_suggestion_id
                  ? ` · from suggestion #${v.source_suggestion_id}`
                  : v.version_number === 1
                    ? ' · original'
                    : ' · confirmed changes'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
