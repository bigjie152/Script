type ErrorBannerProps = {
  title?: string;
  message?: string;
};

export function ErrorBanner({ title = "出现错误", message }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-sm text-red-700">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-red-600/90">{message}</div>
    </div>
  );
}
