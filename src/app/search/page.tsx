import { SearchPanel } from '@/features/drive-search/search-panel';

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Find a contract in Drive</h1>
      <SearchPanel />
    </main>
  );
}
