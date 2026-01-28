"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

type BlockMenuProps = {
  editor: Editor | null;
  open: boolean;
  top: number;
  left: number;
  onClose: () => void;
  onDelete: () => void;
  onInsert: () => void;
};

export function BlockMenu({
  editor,
  open,
  top,
  left,
  onClose,
  onDelete,
  onInsert
}: BlockMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open || !editor) return null;

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute z-20 w-52 rounded-lg border border-slate-200 bg-white shadow-lg"
      style={{ top: top + 8, left: left + 32 }}
    >
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        块操作
      </div>
      <div className="px-2 pb-2">
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(() => editor.chain().focus().setParagraph().run())}
        >
          转换为正文
        </button>
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(() =>
            editor.chain().focus().setNode("heading", { level: 1 }).run()
          )}
        >
          转换为标题 1
        </button>
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(() =>
            editor.chain().focus().setNode("heading", { level: 2 }).run()
          )}
        >
          转换为标题 2
        </button>
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(() => editor.chain().focus().toggleBlockquote().run())}
        >
          转换为引用
        </button>
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(() => editor.chain().focus().toggleBulletList().run())}
        >
          转换为无序列表
        </button>
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(() => editor.chain().focus().toggleOrderedList().run())}
        >
          转换为有序列表
        </button>
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(() => editor.chain().focus().toggleCodeBlock().run())}
        >
          转换为代码块
        </button>
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: "databaseLike",
                attrs: {
                  columns: ["字段", "内容"],
                  rows: [["示例", "这里填写结构化内容"]],
                  metadata: "结构化记录"
                }
              })
              .run()
          )}
        >
          插入数据库块
        </button>
        <div className="my-2 h-px bg-slate-100" />
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
          onClick={run(onInsert)}
        >
          在下方插入新块
        </button>
        <button
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
          onClick={run(onDelete)}
        >
          删除当前块
        </button>
      </div>
    </div>
  );
}
