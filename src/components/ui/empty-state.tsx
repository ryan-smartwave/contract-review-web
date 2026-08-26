export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  );
}
