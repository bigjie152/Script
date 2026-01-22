"use client";

import type { Editor } from "@tiptap/react";

type BubbleMenuBarProps = {
  editor: Editor;
};

const BUTTON_CLASS = "bubble-menu-button";

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  return (
    <div className="bubble-menu">
      <button
        type="button"
        className={BUTTON_CLASS + (editor.isActive("bold") ? " is-active" : "")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        加粗
      </button>
      <button
        type="button"
        className={BUTTON_CLASS + (editor.isActive("italic") ? " is-active" : "")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        斜体
      </button>
      <button
        type="button"
        className={BUTTON_CLASS + (editor.isActive("strike") ? " is-active" : "")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        删除线
      </button>
      <span className="bubble-menu-divider" />
      <button
        type="button"
        className={BUTTON_CLASS + (editor.isActive("heading", { level: 1 }) ? " is-active" : "")}
        onClick={() => editor.chain().focus().setNode("heading", { level: 1 }).run()}
      >
        H1
      </button>
      <button
        type="button"
        className={BUTTON_CLASS + (editor.isActive("heading", { level: 2 }) ? " is-active" : "")}
        onClick={() => editor.chain().focus().setNode("heading", { level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        className={BUTTON_CLASS + (editor.isActive("blockquote") ? " is-active" : "")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        引用
      </button>
      <button
        type="button"
        className={BUTTON_CLASS + (editor.isActive("bulletList") ? " is-active" : "")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        无序
      </button>
      <button
        type="button"
        className={BUTTON_CLASS + (editor.isActive("orderedList") ? " is-active" : "")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        有序
      </button>
    </div>
  );
}
