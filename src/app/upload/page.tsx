import { UploadForm } from '@/features/upload/upload-form';

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Upload a contract</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manually submit a PDF or DOCX — it goes through the same classification
          pipeline as email-detected contracts.
        </p>
      </div>
      <UploadForm />
    </main>
  );
}
