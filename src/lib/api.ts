import type { DocumentOut, DocumentDetail, DriveFile, DriveSearch } from '@/types/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body.detail ?? `Request failed (${res.status})`);
  return body as T;
}

export function listDocuments(): Promise<DocumentOut[]> {
  return request('/documents');
}

export function documentFileUrl(id: number): string {
  return `${BASE}/documents/${id}/file`;
}

export function versionFileUrl(documentId: number, versionNumber: number): string {
  return `${BASE}/documents/${documentId}/versions/${versionNumber}/file`;
}

export function uploadContract(file: File): Promise<DocumentOut> {
  const form = new FormData();
  form.append('file', file);
  return request('/upload', { method: 'POST', body: form });
}

export function searchDrive(q: string): Promise<DriveSearch> {
  return request(`/drive/search?q=${encodeURIComponent(q)}`);
}

export function getDocument(id: number): Promise<DocumentDetail> {
  return request(`/documents/${id}`);
}

export function confirmSuggestions(
  documentId: number,
  appliedIds: number[],
  rejectedIds: number[],
): Promise<DocumentDetail> {
  return request(`/documents/${documentId}/suggestions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applied_ids: appliedIds, rejected_ids: rejectedIds }),
  });
}

export function confirmDriveFile(file: DriveFile): Promise<DocumentOut> {
  return request('/drive/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: file.file_id, name: file.name, mime_type: file.mime_type }),
  });
}
