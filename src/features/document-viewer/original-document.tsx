'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { documentFileUrl } from '@/lib/api';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function PdfView({ url }: { url: string }) {
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  return (
    <Document
      file={url}
      onLoadSuccess={(pdf) => setPageCount(pdf.numPages)}
      onLoadError={(e) => setError(`Could not render the PDF: ${e.message}`)}
      loading={<p className="text-sm text-text-muted">Rendering document…</p>}
      className="flex flex-col items-center gap-4"
    >
      {Array.from({ length: pageCount }, (_, i) => (
        <Page
          key={i + 1}
          pageNumber={i + 1}
          width={720}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="border border-border shadow-sm"
        />
      ))}
    </Document>
  );
}

function DocxView({ url }: { url: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const buffer = await res.arrayBuffer();
        const { renderAsync } = await import('docx-preview');
        if (!cancelled && container.current) {
          await renderAsync(buffer, container.current, undefined, {
            inWrapper: true,
            ignoreLastRenderedPageBreak: true,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not render the document');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  return <div ref={container} className="docx-preview-container overflow-x-auto" />;
}

export default function OriginalDocument({
  documentId,
  mimeType,
}: {
  documentId: number;
  mimeType: string;
}) {
  const url = documentFileUrl(documentId);
  return mimeType === 'application/pdf' ? <PdfView url={url} /> : <DocxView url={url} />;
}
