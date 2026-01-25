"use client";

type EditorSurfaceProps = {
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
};

export function EditorSurface({
  value,
  editable = true,
  onChange
}: EditorSurfaceProps) {
  return (
    <div className="glass-panel-strong h-full w-full px-10 py-8">
      <textarea
        className="h-[420px] w-full resize-none rounded-xl border border-white/60 bg-white/70 p-4 text-sm text-ink outline-none focus:border-ink/40"
        placeholder="在此输入剧情内容..."
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={!editable}
      />
    </div>
  );
}
