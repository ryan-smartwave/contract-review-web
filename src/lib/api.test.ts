import { afterEach, expect, test, vi } from 'vitest';
import { applySuggestion, confirmDriveFile, getDocument, listDocuments, rejectSuggestion, searchDrive, uploadContract } from './api';

afterEach(() => vi.restoreAllMocks());

function mockFetch(status: number, body: unknown) {
  return vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status < 300,
    status,
    json: async () => body,
  }));
}

test('listDocuments returns documents', async () => {
  mockFetch(200, [{ id: 1, filename: 'nda.pdf' }]);
  const docs = await listDocuments();
  expect(docs[0].filename).toBe('nda.pdf');
});

test('uploadContract posts multipart and surfaces backend error detail', async () => {
  mockFetch(422, { detail: 'Unsupported file type. Upload a PDF or DOCX.' });
  await expect(uploadContract(new File(['x'], 'cat.gif'))).rejects.toThrow(/PDF or DOCX/);
});

test('searchDrive returns results and clarifying question', async () => {
  mockFetch(200, { results: [{ file_id: 'f1', name: 'A.pdf' }], clarifying_question: null });
  const search = await searchDrive('acme');
  expect(search.results[0].name).toBe('A.pdf');
  expect(search.clarifying_question).toBeNull();
});

test('applySuggestion posts and returns detail', async () => {
  mockFetch(200, { id: 1, text: 'new text', suggestions: [], versions: [] });
  const detail = await applySuggestion(5);
  expect(detail.text).toBe('new text');
  expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/suggestions/5/apply');
  expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('POST');
});

test('confirmDriveFile posts file identity', async () => {
  mockFetch(201, { id: 9, filename: 'A.pdf' });
  const doc = await confirmDriveFile({
    file_id: 'f1', name: 'A', modified_time: '2026-08-01T00:00:00Z',
    mime_type: 'application/vnd.google-apps.document', web_view_link: null,
  });
  expect(doc.id).toBe(9);
});
