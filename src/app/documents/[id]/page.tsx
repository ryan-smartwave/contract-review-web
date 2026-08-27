import { DocumentView } from '@/features/document-viewer/document-view';

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <DocumentView documentId={Number(id)} />
    </main>
  );
}
