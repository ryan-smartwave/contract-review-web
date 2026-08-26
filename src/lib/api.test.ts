import { afterEach, expect, test, vi } from 'vitest';
import { listDocuments, searchDrive, uploadContract } from './api';

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

test('searchDrive unwraps results', async () => {
  mockFetch(200, { results: [{ file_id: 'f1', name: 'Acme MSA.pdf' }] });
  const results = await searchDrive('acme');
  expect(results[0].name).toBe('Acme MSA.pdf');
});
