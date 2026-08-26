'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { searchDrive } from '@/lib/api';
import type { DriveFile } from '@/types/api';

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DriveFile[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    try {
      setResults(await searchDrive(query.trim()));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contracts in Drive…"
          className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </Button>
      </form>
      {results !== null && results.length === 0 && (
        <EmptyState
          title="No matching contracts found"
          description="Try a different keyword, or upload the contract manually."
        />
      )}
      {results !== null && results.length > 0 && (
        <ul className="flex flex-col gap-3">
          {results.map((file) => (
            <li key={file.file_id}>
              <Card className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-text-muted">
                    Modified {new Date(file.modified_time).toLocaleDateString()}
                  </p>
                </div>
                {file.web_view_link && (
                  <a
                    className="text-sm text-primary hover:underline"
                    href={file.web_view_link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Drive
                  </a>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
