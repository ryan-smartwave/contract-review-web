import { AutoRefresh } from '@/features/review-queue/auto-refresh';
import { DocumentList } from '@/features/review-queue/document-list';
import { listDocuments } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const documents = await listDocuments();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <AutoRefresh />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="mt-1 text-sm text-text-muted">
          Contracts detected in the monitored inbox and manual uploads — classified
          automatically, updated live.
        </p>
      </div>
      <DocumentList documents={documents} />
    </main>
  );
}
