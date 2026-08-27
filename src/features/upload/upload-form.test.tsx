import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

const uploadContract = vi.fn();
vi.mock('@/lib/api', () => ({ uploadContract: (...a: unknown[]) => uploadContract(...a) }));

import { UploadForm } from './upload-form';

test('shows confirmation with classification after upload', async () => {
  uploadContract.mockResolvedValue({
    id: 1, filename: 'nda.pdf', is_contract_revision: true, confidence: 0.9,
    reasoning: 'stub', source: 'upload', mime_type: 'application/pdf',
    detected_at: '2026-08-26T00:00:00Z',
  });
  render(<UploadForm />);
  const input = screen.getByLabelText(/choose a contract/i);
  await userEvent.upload(input, new File(['%PDF'], 'nda.pdf', { type: 'application/pdf' }));
  await userEvent.click(screen.getByRole('button', { name: /upload/i }));
  await waitFor(() => expect(screen.getByText(/received nda\.pdf/i)).toBeInTheDocument());
  expect(screen.getByText(/contract revision/i)).toBeInTheDocument();
});

test('shows backend error for unsupported type', async () => {
  uploadContract.mockRejectedValue(new Error('Unsupported file type. Upload a PDF or DOCX.'));
  render(<UploadForm />);
  const input = screen.getByLabelText(/choose a contract/i);
  await userEvent.upload(input, new File(['x'], 'cat.gif', { type: 'image/gif' }), { applyAccept: false });
  await userEvent.click(screen.getByRole('button', { name: /upload/i }));
  await waitFor(() => expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument());
});

test('dropping a pdf selects it', () => {
  render(<UploadForm />);
  const zone = screen.getByText(/choose a contract/i).closest('label')!;
  fireEvent.drop(zone, {
    dataTransfer: { files: [new File(['%PDF'], 'dropped.pdf', { type: 'application/pdf' })] },
  });
  expect(screen.getByText(/dropped\.pdf/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /upload/i })).toBeEnabled();
});

test('dropping an unsupported file shows error and stays disabled', () => {
  render(<UploadForm />);
  const zone = screen.getByText(/choose a contract/i).closest('label')!;
  fireEvent.drop(zone, {
    dataTransfer: { files: [new File(['x'], 'cat.gif', { type: 'image/gif' })] },
  });
  expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
});
