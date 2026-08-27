import { SearchPanel } from '@/features/drive-search/search-panel';

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Find a contract in Drive</h1>
        <p className="mt-1 text-sm text-text-muted">
          Search the authorized Google Drive by keyword and open the matching
          document directly.
        </p>
      </div>
      <SearchPanel />
    </main>
  );
}
