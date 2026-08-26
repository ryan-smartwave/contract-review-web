import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import type { DocumentOut } from '@/types/api';
import { DocumentList } from './document-list';

const doc = (over: Partial<DocumentOut>): DocumentOut => ({
  id: 1, filename: 'msa-v2.docx', source: 'email',
  mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  detected_at: '2026-08-26T05:00:00Z', is_contract_revision: true,
  confidence: 0.93, reasoning: 'Redlined MSA', ...over,
});

test('renders documents with classification badge and confidence', () => {
  render(<DocumentList documents={[doc({})]} />);
  expect(screen.getByText('msa-v2.docx')).toBeInTheDocument();
  expect(screen.getByText(/contract revision/i)).toBeInTheDocument();
  expect(screen.getByText(/93%/)).toBeInTheDocument();
});

test('empty list shows empty state', () => {
  render(<DocumentList documents={[]} />);
  expect(screen.getByText(/no contracts detected yet/i)).toBeInTheDocument();
});
