import Link from 'next/link';
import { DocumentList } from '@/features/review-queue/document-list';
import { listDocuments } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const documents = await listDocuments();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Review queue</h1>
        <nav className="flex gap-4 text-sm">
          <Link className="text-primary hover:underline" href="/upload">Upload</Link>
          <Link className="text-primary hover:underline" href="/search">Drive search</Link>
        </nav>
      </div>
      <DocumentList documents={documents} />
    </main>
  );
}
