'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircleIcon, UploadCloudIcon } from '@/components/ui/icons';
import { uploadContract } from '@/lib/api';
import type { DocumentOut } from '@/types/api';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DocumentOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  function takeFile(candidate: File | null) {
    if (!candidate) return;
    if (!/\.(pdf|docx)$/i.test(candidate.name)) {
      setError('Unsupported file type. Upload a PDF or DOCX.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(candidate);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
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
        <label
          htmlFor="contract-file"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); takeFile(e.dataTransfer.files?.[0] ?? null); }}
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors hover:border-primary hover:bg-surface ${dragging ? 'border-primary bg-surface' : 'border-border'}`}
        >
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloudIcon />
          </span>
          <span className="font-medium">Choose a contract (PDF or DOCX)</span>
          <span className="text-sm text-text-muted">
            {file ? (
              <>
                <span className="font-medium text-text">{file.name}</span>
                {' · '}
                {(file.size / 1024).toFixed(0)} KB
              </>
            ) : (
              'Click to browse or drag a file here'
            )}
          </span>
        </label>
        <input
          id="contract-file"
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => takeFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <Button type="submit" disabled={!file || busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </form>
      {result && (
        <div className="mt-4 rounded-lg bg-success/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-success">
              <CheckCircleIcon />
            </span>
            <p className="text-sm font-medium">Received {result.filename}.</p>
            <Badge tone={result.is_contract_revision ? 'success' : 'neutral'}>
              {result.is_contract_revision ? 'Contract revision' : 'Not a contract revision'}
            </Badge>
            {result.confidence !== null && (
              <span className="text-sm text-text-muted">
                {Math.round(result.confidence * 100)}%
              </span>
            )}
          </div>
          {result.reasoning && (
            <p className="mt-2 text-sm text-text-muted">{result.reasoning}</p>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </Card>
  );
}
