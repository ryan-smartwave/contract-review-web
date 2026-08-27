'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentIcon, ExternalLinkIcon, SearchIcon } from '@/components/ui/icons';
import { searchDrive } from '@/lib/api';
import type { DriveSearch } from '@/types/api';

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<DriveSearch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    setSearch(null);
    try {
      setSearch(await searchDrive(query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative w-full">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts in Drive…"
            className="w-full rounded-md border border-border bg-surface-raised py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-text-muted"
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </Button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}
      {search !== null && search.results.length === 0 && (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="No matching contracts found"
          description="Try a different keyword, or upload the contract manually."
        />
      )}
      {search !== null && search.results.length > 0 && (
        <>
          <p className="text-sm text-text-muted">
            {search.results.length} result{search.results.length === 1 ? '' : 's'}, most recently
            modified first
          </p>
          <ul className="flex flex-col gap-3">
            {search.results.map((file) => (
              <li key={file.file_id}>
                <Card className="flex items-center gap-4 transition-shadow hover:shadow-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <DocumentIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-sm text-text-muted">
                      Modified {new Date(file.modified_time).toLocaleDateString()}
                    </p>
                  </div>
                  {file.web_view_link && (
                    <a
                      className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      href={file.web_view_link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Drive
                      <ExternalLinkIcon />
                    </a>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
