"use client";

type BlockHandleProps = {
  top: number;
  left: number;
  visible: boolean;
  onOpenMenu: () => void;
  onInsert: () => void;
};

export function BlockHandle({
  top,
  left,
  visible,
  onOpenMenu,
  onInsert
}: BlockHandleProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute -translate-x-7 flex items-center gap-1 rounded-md border border-slate-200 bg-white/90 px-1 py-0.5 shadow-sm"
      style={{ top, left }}
    >
      <button
        type="button"
        className="h-6 w-6 rounded text-xs text-slate-500 hover:bg-slate-100"
        onClick={onOpenMenu}
        title="块菜单"
      >
        ⋮⋮
      </button>
      <button
        type="button"
        className="h-6 w-6 rounded text-xs text-slate-500 hover:bg-slate-100"
        onClick={onInsert}
        title="插入新块"
      >
        +
      </button>
    </div>
  );
}
