import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

const searchDrive = vi.fn();
const confirmDriveFile = vi.fn();
vi.mock('@/lib/api', () => ({
  searchDrive: (...a: unknown[]) => searchDrive(...a),
  confirmDriveFile: (...a: unknown[]) => confirmDriveFile(...a),
}));

import { SearchPanel } from './search-panel';

const file = (name: string) => ({
  file_id: name, name, mime_type: 'application/pdf',
  modified_time: '2026-08-01T00:00:00Z', web_view_link: null,
});

test('renders results with name and modified date', async () => {
  searchDrive.mockResolvedValue({
    results: [{
      file_id: 'f1', name: 'Acme MSA v3.pdf', mime_type: 'application/pdf',
      modified_time: '2026-08-01T00:00:00Z', web_view_link: 'https://drive.google.com/x',
    }],
    clarifying_question: null,
  });
  render(<SearchPanel />);
  await userEvent.type(screen.getByRole('searchbox'), 'acme');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
  await waitFor(() => expect(screen.getByText('Acme MSA v3.pdf')).toBeInTheDocument());
  expect(screen.getByRole('link', { name: /open in drive/i })).toHaveAttribute(
    'href', 'https://drive.google.com/x',
  );
});

test('no matches shows graceful empty state', async () => {
  searchDrive.mockResolvedValue({ results: [], clarifying_question: null });
  render(<SearchPanel />);
  await userEvent.type(screen.getByRole('searchbox'), 'zzz');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
  await waitFor(() =>
    expect(screen.getByText(/no matching contracts found/i)).toBeInTheDocument(),
  );
});

test('search error displays error message and hides empty state', async () => {
  searchDrive.mockRejectedValue(new Error('Request failed (500)'));
  render(<SearchPanel />);
  await userEvent.type(screen.getByRole('searchbox'), 'test');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
  await waitFor(() =>
    expect(screen.getByText('Request failed (500)')).toBeInTheDocument(),
  );
  expect(screen.queryByText(/no matching contracts found/i)).not.toBeInTheDocument();
});

test('clarifying question shown for multiple results', async () => {
  searchDrive.mockResolvedValue({
    results: [file('Acme MSA.pdf'), file('Acme NDA.pdf')],
    clarifying_question: "I found 2 contracts matching 'acme'. Which one should I review?",
  });
  render(<SearchPanel />);
  await userEvent.type(screen.getByRole('searchbox'), 'acme');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
  await waitFor(() =>
    expect(screen.getByText(/which one should i review/i)).toBeInTheDocument());
});

test('review button confirms the file', async () => {
  const assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, assign });
  searchDrive.mockResolvedValue({ results: [file('Acme MSA.pdf')], clarifying_question: null });
  confirmDriveFile.mockResolvedValue({ id: 9 });
  render(<SearchPanel />);
  await userEvent.type(screen.getByRole('searchbox'), 'acme');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
  await waitFor(() => screen.getByRole('button', { name: /^review$/i }));
  await userEvent.click(screen.getByRole('button', { name: /^review$/i }));
  await waitFor(() => expect(confirmDriveFile).toHaveBeenCalled());
  expect(assign).toHaveBeenCalledWith('/documents/9');
});
