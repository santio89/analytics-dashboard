export function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-outline text-xs" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
