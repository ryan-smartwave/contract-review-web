import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentIcon, InboxIcon } from '@/components/ui/icons';
import type { DocumentOut } from '@/types/api';

export function DocumentList({ documents }: { documents: DocumentOut[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<InboxIcon className="h-7 w-7" />}
        title="No contracts detected yet"
        description="Contracts arriving in the monitored inbox or uploaded manually will appear here."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Card className="flex items-start gap-4 transition-shadow hover:shadow-md">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DocumentIcon />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <a href={'/documents/' + doc.id} className="truncate font-medium hover:underline">
                  {doc.filename}
                </a>
                <div className="flex shrink-0 items-center gap-2">
                  {doc.is_contract_revision === null ? (
                    <Badge tone="warning">Classifying…</Badge>
                  ) : doc.is_contract_revision ? (
                    <Badge tone="success">Contract revision</Badge>
                  ) : (
                    <Badge tone="neutral">Not a contract revision</Badge>
                  )}
                  {doc.confidence !== null && (
                    <span
                      className="text-sm font-medium text-text-muted"
                      title="Classification confidence"
                    >
                      {Math.round(doc.confidence * 100)}%
                    </span>
                  )}
                  {doc.review_seconds !== null && (
                    <Badge tone="success">redlines ready · {Math.round(doc.review_seconds)}s</Badge>
                  )}
                </div>
              </div>
              <p className="mt-0.5 text-sm text-text-muted">
                via {doc.source} · {new Date(doc.detected_at).toLocaleString()}
              </p>
              {doc.reasoning && (
                <p className="mt-2 border-l-2 border-border pl-3 text-sm text-text-muted">
                  {doc.reasoning}
                </p>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
