'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { uploadContract } from '@/lib/api';
import type { DocumentOut } from '@/types/api';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DocumentOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await uploadContract(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="text-sm font-medium" htmlFor="contract-file">
          Choose a contract (PDF or DOCX)
        </label>
        <input
          id="contract-file"
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <Button type="submit" disabled={!file || busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </form>
      {result && (
        <div className="mt-4 flex items-center gap-2">
          <p className="text-sm">Received {result.filename}.</p>
          <Badge tone={result.is_contract_revision ? 'success' : 'neutral'}>
            {result.is_contract_revision ? 'Contract revision' : 'Not a contract revision'}
          </Badge>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </Card>
  );
}
