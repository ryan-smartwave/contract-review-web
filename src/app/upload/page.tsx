import { UploadForm } from '@/features/upload/upload-form';

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Upload a contract</h1>
      <UploadForm />
    </main>
  );
}
