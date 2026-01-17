"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { EditorDocument } from "../types/editorDocument";
import { updateDocumentContent } from "./adapters/plainTextAdapter";
import { DatabaseLikeBlock } from "./tiptap/databaseLikeBlock";
import { SlashCommand } from "./tiptap/slashCommand";
import { mentionSuggestion } from "./tiptap/mentionSuggestion";

type DocumentEditorProps = {
  value: EditorDocument;
  onChange: (next: EditorDocument) => void;
  onSave?: () => void;
  readonly?: boolean;
};

export function DocumentEditor({
  value,
  onChange,
  readonly = false
}: DocumentEditorProps) {
  const lastContentRef = useRef("");

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        listItem: {},
        blockquote: {},
        hardBreak: {},
        history: {},
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false
      }),
      DatabaseLikeBlock,
      Mention.configure({
        HTMLAttributes: {
          class: "mention"
        },
        suggestion: mentionSuggestion
      }),
      SlashCommand
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: value.content,
    editable: !readonly,
    editorProps: {
      attributes: {
        class: "tiptap"
      }
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      lastContentRef.current = JSON.stringify(json);
      onChange(updateDocumentContent(value, json as Record<string, unknown>));
    }
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readonly);
  }, [editor, readonly]);

  useEffect(() => {
    if (!editor) return;
    const serialized = JSON.stringify(value.content ?? {});
    if (serialized === lastContentRef.current) return;
    editor.commands.setContent(value.content ?? { type: "doc", content: [] }, false);
    lastContentRef.current = serialized;
  }, [editor, value.content]);

  return (
    <div className="glass-panel-strong flex h-full w-full flex-col gap-3 px-6 py-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <button
          type="button"
          className="rounded-lg border border-white/60 bg-white/70 px-2 py-1 text-xs text-ink"
          onClick={() => editor?.chain().focus().setNode("heading", { level: 1 }).run()}
        >
          标题 1
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/60 bg-white/70 px-2 py-1 text-xs text-ink"
          onClick={() => editor?.chain().focus().setNode("heading", { level: 2 }).run()}
        >
          标题 2
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/60 bg-white/70 px-2 py-1 text-xs text-ink"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          无序列表
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/60 bg-white/70 px-2 py-1 text-xs text-ink"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          有序列表
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/60 bg-white/70 px-2 py-1 text-xs text-ink"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          引用块
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/60 bg-white/70 px-2 py-1 text-xs text-ink"
          onClick={() =>
            editor
              ?.chain()
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
          }
        >
          数据库块
        </button>
        <span className="text-xs text-muted">
          输入 “/” 可呼出命令，输入 “@” 可插入提及
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
