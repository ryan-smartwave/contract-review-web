import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import type { DocumentDetail } from '@/types/api';

const api = { getDocument: vi.fn(), confirmSuggestions: vi.fn() };
vi.mock('./original-document', () => ({
  default: () => <div>ORIGINAL DOC RENDER</div>,
}));

vi.mock('@/lib/api', () => ({
  getDocument: (...a: unknown[]) => api.getDocument(...a),
  confirmSuggestions: (...a: unknown[]) => api.confirmSuggestions(...a),
  versionFileUrl: (documentId: number, versionNumber: number) =>
    `http://localhost:8000/documents/${documentId}/versions/${versionNumber}/file`,
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
  versions: [
    { version_number: 1, source_suggestion_id: null, created_at: '2026-08-27T00:00:00Z', filename: 'msa.pdf' },
  ],
  ...over,
});

test('renders text, highlighted anchor, latency, and suggestion card', async () => {
  api.getDocument.mockResolvedValue(detail());
  render(<DocumentView documentId={1} />);
  await waitFor(() => expect(screen.getByText(/Term is 12 months/)).toBeInTheDocument());
  expect(screen.getByText('Liability is unlimited.', { selector: 'del' })).toBeInTheDocument();
  expect(screen.getByText(/ready in 42s/i)).toBeInTheDocument();
  expect(screen.getByText('Liability is capped.', { selector: 'ins' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
});

test('accept stages locally and confirm sends one batch with all decisions', async () => {
  api.getDocument.mockResolvedValue(detail({
    suggestions: [
      detail().suggestions[0],
      {
        id: 6, clause: 'Term', original_text: 'Term is 12 months.',
        replacement_text: 'Term is 24 months.', rationale: 'longer', status: 'pending',
      },
    ],
  }));
  api.confirmSuggestions.mockResolvedValue(detail({
    text: 'Term is 12 months. Liability is capped.',
    suggestions: [
      { ...detail().suggestions[0], status: 'applied' },
      {
        id: 6, clause: 'Term', original_text: 'Term is 12 months.',
        replacement_text: 'Term is 24 months.', rationale: 'longer', status: 'rejected',
      },
    ],
    versions: [
      ...detail().versions,
      { version_number: 2, source_suggestion_id: null, created_at: '2026-08-27T00:01:00Z', filename: 'msa - v2.docx' },
    ],
  }));
  render(<DocumentView documentId={1} />);
  await waitFor(() => screen.getAllByRole('button', { name: /accept/i }));
  await userEvent.click(screen.getAllByRole('button', { name: /accept/i })[0]);
  await userEvent.click(screen.getAllByRole('button', { name: /^reject$/i })[1]);
  expect(api.confirmSuggestions).not.toHaveBeenCalled();
  const confirm = screen.getByRole('button', { name: /confirm & save \(2\)/i });
  await userEvent.click(confirm);
  await waitFor(() => expect(api.confirmSuggestions).toHaveBeenCalledWith(1, [5], [6]));
  await waitFor(() => expect(screen.getByText(/applied/i)).toBeInTheDocument());
  expect(screen.getByRole('link', { name: 'msa - v2.docx' })).toBeInTheDocument();
});

test('clicking a staged choice again unstages it and hides the confirm bar', async () => {
  api.getDocument.mockResolvedValue(detail());
  render(<DocumentView documentId={1} />);
  await waitFor(() => screen.getByRole('button', { name: /accept/i }));
  await userEvent.click(screen.getByRole('button', { name: /accept/i }));
  expect(screen.getByRole('button', { name: /confirm & save \(1\)/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /accept/i }));
  expect(screen.queryByRole('button', { name: /confirm & save/i })).not.toBeInTheDocument();
});

test('batch version without a source suggestion is labeled as confirmed changes', async () => {
  api.getDocument.mockResolvedValue(detail({
    versions: [
      { version_number: 1, source_suggestion_id: null, created_at: '2026-08-27T00:00:00Z', filename: 'msa.pdf' },
      { version_number: 2, source_suggestion_id: null, created_at: '2026-08-27T00:01:00Z', filename: 'msa - v2.docx' },
    ],
  }));
  render(<DocumentView documentId={1} />);
  await waitFor(() => screen.getByRole('link', { name: 'msa - v2.docx' }));
  expect(screen.getByText(/confirmed changes/)).toBeInTheDocument();
  expect(screen.getByText(/· original/)).toBeInTheDocument();
});

test('rejected suggestion stays visible as dismissed', async () => {
  api.getDocument.mockResolvedValue(detail({
    suggestions: [{ ...detail().suggestions[0], status: 'rejected' }],
  }));
  render(<DocumentView documentId={1} />);
  await waitFor(() => expect(screen.getByText(/rejected/i)).toBeInTheDocument());
  expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
});

test('longer anchor wins when one original_text is a substring of another', async () => {
  api.getDocument.mockResolvedValue(detail({
    text: 'Term. Liability is unlimited. End.',
    suggestions: [
      {
        id: 5, clause: 'Liability', original_text: 'Liability is unlimited.',
        replacement_text: 'Liability is capped.', rationale: 'risk', status: 'pending',
      },
      {
        id: 6, clause: 'Liability label', original_text: 'Liability',
        replacement_text: 'Responsibility', rationale: 'terminology', status: 'pending',
      },
    ],
  }));
  render(<DocumentView documentId={1} />);
  await waitFor(() =>
    expect(screen.getByText('Liability is unlimited.', { selector: 'del' })).toBeInTheDocument(),
  );
});

test('original tab renders the styled document and review tab returns', async () => {
  api.getDocument.mockResolvedValue(detail());
  render(<DocumentView documentId={1} />);
  await waitFor(() => screen.getByRole('tab', { name: /original document/i }));
  await userEvent.click(screen.getByRole('tab', { name: /original document/i }));
  await waitFor(() => expect(screen.getByText('ORIGINAL DOC RENDER')).toBeInTheDocument());
  expect(screen.queryByText(/Term is 12 months/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: /^review$/i }));
  expect(screen.getByText(/Term is 12 months/)).toBeInTheDocument();
});

test('versions with a filename render as download links', async () => {
  api.getDocument.mockResolvedValue(detail({
    versions: [
      { version_number: 1, source_suggestion_id: null, created_at: '2026-08-27T00:00:00Z', filename: 'msa.pdf' },
      { version_number: 2, source_suggestion_id: 5, created_at: '2026-08-27T00:01:00Z', filename: 'msa - v2.docx' },
    ],
  }));
  render(<DocumentView documentId={1} />);
  const v1 = await waitFor(() => screen.getByRole('link', { name: 'msa.pdf' }));
  const v2 = screen.getByRole('link', { name: 'msa - v2.docx' });
  expect(v1.getAttribute('href')).toContain('/versions/1/file');
  expect(v2.getAttribute('href')).toContain('/versions/2/file');
});

test('version without a filename renders without a link or stray leading space', async () => {
  api.getDocument.mockResolvedValue(detail({
    versions: [
      { version_number: 1, source_suggestion_id: null, created_at: '2026-08-27T00:00:00Z', filename: 'msa.pdf' },
      { version_number: 2, source_suggestion_id: 5, created_at: '2026-08-27T00:01:00Z', filename: null },
    ],
  }));
  render(<DocumentView documentId={1} />);
  await waitFor(() => screen.getByRole('link', { name: 'msa.pdf' }));
  expect(screen.queryByRole('link', { name: /v2/i })).not.toBeInTheDocument();
  const v2Item = screen.getByText(/from suggestion #5/).closest('li');
  expect(v2Item?.textContent?.startsWith('v2')).toBe(true);
});

test('paragraph breaks render as separate blocks with title styling', async () => {
  api.getDocument.mockResolvedValue(detail({
    text: 'MASTER SERVICES AGREEMENT\n\n1. TERM. Twelve months.\n\n2. FEES. Ninety days.',
    suggestions: [],
  }));
  const { container } = render(<DocumentView documentId={1} />);
  await waitFor(() => expect(screen.getByText('MASTER SERVICES AGREEMENT')).toBeInTheDocument());
  const paras = container.querySelectorAll('[data-doc-paragraph]');
  expect(paras.length).toBe(3);
  expect(screen.getByText('MASTER SERVICES AGREEMENT').closest('p')?.className).toContain('font-semibold');
});
