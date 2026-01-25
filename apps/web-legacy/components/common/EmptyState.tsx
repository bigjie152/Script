type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="glass-panel flex min-h-[160px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="text-base font-semibold text-ink">{title}</div>
      {description ? (
        <div className="mt-2 text-sm text-muted">{description}</div>
      ) : null}
    </div>
  );
}
