"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type EditorSurfaceProps = {
  content: Record<string, unknown>;
  editable?: boolean;
  onChange?: (value: Record<string, unknown>) => void;
};

export function EditorSurface({
  content,
  editable = true,
  onChange
}: EditorSurfaceProps) {
  const lastExternal = useRef<string>("");

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    editorProps: {
      attributes: {
        class:
          "max-w-none focus:outline-none font-body text-base leading-7 text-ink"
      }
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json as Record<string, unknown>);
    }
  });

  useEffect(() => {
    if (!editor) return;
    const next = JSON.stringify(content || {});
    if (next !== lastExternal.current) {
      lastExternal.current = next;
      editor.commands.setContent(content || { type: "doc", content: [] });
    }
  }, [content, editor]);

  return (
    <div className="glass-panel-strong h-full w-full overflow-y-auto px-10 py-8">
      {editor ? <EditorContent editor={editor} /> : null}
    </div>
  );
}
