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
    <div className="block-handle-floating" style={{ top, left }}>
      <button type="button" className="block-handle-btn" onClick={onOpenMenu}>
        ⋮⋮
      </button>
      <button type="button" className="block-handle-btn" onClick={onInsert}>
        +
      </button>
    </div>
  );
}
