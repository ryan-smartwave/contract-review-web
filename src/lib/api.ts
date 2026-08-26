import type { DocumentOut, DriveFile } from '@/types/api';

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

export function uploadContract(file: File): Promise<DocumentOut> {
  const form = new FormData();
  form.append('file', file);
  return request('/upload', { method: 'POST', body: form });
}

export async function searchDrive(q: string): Promise<DriveFile[]> {
  const body = await request<{ results: DriveFile[] }>(
    `/drive/search?q=${encodeURIComponent(q)}`,
  );
  return body.results;
}
