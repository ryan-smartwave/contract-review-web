import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import type { DocumentDetail } from '@/types/api';

const api = { getDocument: vi.fn(), applySuggestion: vi.fn(), rejectSuggestion: vi.fn() };
vi.mock('@/lib/api', () => ({
  getDocument: (...a: unknown[]) => api.getDocument(...a),
  applySuggestion: (...a: unknown[]) => api.applySuggestion(...a),
  rejectSuggestion: (...a: unknown[]) => api.rejectSuggestion(...a),
}));

import { DocumentView } from './document-view';

const detail = (over: Partial<DocumentDetail> = {}): DocumentDetail => ({
  id: 1, filename: 'msa.pdf', source: 'email', mime_type: 'application/pdf',
  detected_at: '2026-08-27T00:00:00Z', is_contract_revision: true,
  confidence: 0.9, reasoning: 'r', review_seconds: 42,
  text: 'Term is 12 months. Liability is unlimited.',
  suggestions: [{
    id: 5, clause: 'Liability', original_text: 'Liability is unlimited.',
    replacement_text: 'Liability is capped.', rationale: 'risk', status: 'pending',
  }],
  versions: [{ version_number: 1, source_suggestion_id: null, created_at: '2026-08-27T00:00:00Z' }],
  ...over,
});

test('renders text, highlighted anchor, latency, and suggestion card', async () => {
  api.getDocument.mockResolvedValue(detail());
  render(<DocumentView documentId={1} />);
  await waitFor(() => expect(screen.getByText(/Term is 12 months/)).toBeInTheDocument());
  expect(screen.getByText('Liability is unlimited.', { selector: 'mark' })).toBeInTheDocument();
  expect(screen.getByText(/ready in 42s/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
});

test('apply updates the document and marks suggestion applied', async () => {
  api.getDocument.mockResolvedValue(detail());
  api.applySuggestion.mockResolvedValue(detail({
    text: 'Term is 12 months. Liability is capped.',
    suggestions: [{ ...detail().suggestions[0], status: 'applied' }],
    versions: [...detail().versions, { version_number: 2, source_suggestion_id: 5, created_at: '2026-08-27T00:01:00Z' }],
  }));
  render(<DocumentView documentId={1} />);
  await waitFor(() => screen.getByRole('button', { name: /apply/i }));
  await userEvent.click(screen.getByRole('button', { name: /apply/i }));
  await waitFor(() => expect(screen.getAllByText(/Liability is capped/).length).toBeGreaterThan(0));
  expect(screen.getByText(/applied/i)).toBeInTheDocument();
  expect(screen.getByText(/v2/i)).toBeInTheDocument();
});

test('rejected suggestion stays visible as dismissed', async () => {
  api.getDocument.mockResolvedValue(detail({
    suggestions: [{ ...detail().suggestions[0], status: 'rejected' }],
  }));
  render(<DocumentView documentId={1} />);
  await waitFor(() => expect(screen.getByText(/rejected/i)).toBeInTheDocument());
  expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument();
});
