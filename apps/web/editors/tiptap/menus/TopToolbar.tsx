"use client";

import type { Editor } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Undo2, Redo2, Type } from "lucide-react";

type TopToolbarProps = {
  editor: Editor | null;
  readonly?: boolean;
};

const BUTTON_BASE =
  "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors";

export function TopToolbar({ editor, readonly = false }: TopToolbarProps) {
  if (!editor || readonly) return null;

  const buttonClass = (active: boolean) =>
    `${BUTTON_BASE} ${
      active
        ? "bg-slate-200 text-slate-900"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-slate-100 bg-white/95 px-4 py-2 backdrop-blur">
      <button
        type="button"
        className={buttonClass(editor.isActive("paragraph"))}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Type size={14} />
        正文
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("heading", { level: 1 }))}
        onClick={() => editor.chain().focus().setNode("heading", { level: 1 }).run()}
      >
        <Heading1 size={14} />
        标题1
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().setNode("heading", { level: 2 }).run()}
      >
        <Heading2 size={14} />
        标题2
      </button>
      <span className="mx-1 h-4 w-px bg-slate-200" />
      <button
        type="button"
        className={buttonClass(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={14} />
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </button>
      <span className="mx-1 h-4 w-px bg-slate-200" />
      <button
        type="button"
        className={buttonClass(false)}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={14} />
      </button>
      <button
        type="button"
        className={buttonClass(false)}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={14} />
      </button>
    </div>
  );
}
