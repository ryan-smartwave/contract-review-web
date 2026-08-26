import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { DocumentOut } from '@/types/api';

export function DocumentList({ documents }: { documents: DocumentOut[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No contracts detected yet"
        description="Contracts arriving in the monitored inbox or uploaded manually will appear here."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{doc.filename}</p>
              <p className="text-sm text-text-muted">
                via {doc.source} · {new Date(doc.detected_at).toLocaleString()}
              </p>
              {doc.reasoning && <p className="mt-1 text-sm text-text-muted">{doc.reasoning}</p>}
            </div>
            <div className="flex items-center gap-2">
              {doc.is_contract_revision === null ? (
                <Badge tone="warning">Classifying…</Badge>
              ) : doc.is_contract_revision ? (
                <Badge tone="success">Contract revision</Badge>
              ) : (
                <Badge tone="neutral">Not a contract revision</Badge>
              )}
              {doc.confidence !== null && (
                <span className="text-sm text-text-muted">
                  {Math.round(doc.confidence * 100)}%
                </span>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
