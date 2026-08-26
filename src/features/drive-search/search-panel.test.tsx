import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

const searchDrive = vi.fn();
vi.mock('@/lib/api', () => ({ searchDrive: (...a: unknown[]) => searchDrive(...a) }));

import { SearchPanel } from './search-panel';

test('renders results with name and modified date', async () => {
  searchDrive.mockResolvedValue([{
    file_id: 'f1', name: 'Acme MSA v3.pdf', mime_type: 'application/pdf',
    modified_time: '2026-08-01T00:00:00Z', web_view_link: 'https://drive.google.com/x',
  }]);
  render(<SearchPanel />);
  await userEvent.type(screen.getByRole('searchbox'), 'acme');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
  await waitFor(() => expect(screen.getByText('Acme MSA v3.pdf')).toBeInTheDocument());
  expect(screen.getByRole('link', { name: /open in drive/i })).toHaveAttribute(
    'href', 'https://drive.google.com/x',
  );
});

test('no matches shows graceful empty state', async () => {
  searchDrive.mockResolvedValue([]);
  render(<SearchPanel />);
  await userEvent.type(screen.getByRole('searchbox'), 'zzz');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
  await waitFor(() =>
    expect(screen.getByText(/no matching contracts found/i)).toBeInTheDocument(),
  );
});
