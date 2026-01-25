"use client";

import type { Editor } from "@tiptap/react";

type BubbleMenuBarProps = {
  editor: Editor;
};

const BUTTON_BASE =
  "rounded-md px-2 py-1 text-xs font-medium transition-colors";

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  const buttonClass = (active: boolean) =>
    `${BUTTON_BASE} ${
      active
        ? "bg-slate-200 text-slate-900"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 px-2 py-1 shadow-sm">
      <button
        type="button"
        className={buttonClass(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        加粗
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        斜体
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        删除线
      </button>
      <span className="mx-1 h-4 w-px bg-slate-200" />
      <button
        type="button"
        className={buttonClass(editor.isActive("heading", { level: 1 }))}
        onClick={() => editor.chain().focus().setNode("heading", { level: 1 }).run()}
      >
        H1
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().setNode("heading", { level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        引用
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        无序
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        有序
      </button>
    </div>
  );
}
