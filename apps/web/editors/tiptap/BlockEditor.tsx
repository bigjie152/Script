"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { mergeAttributes } from "@tiptap/core";
import { EditorDocument } from "../../types/editorDocument";
import { updateDocumentContent } from "../adapters/plainTextAdapter";
import { DatabaseLikeBlock } from "./databaseLikeBlock";
import { SlashCommand } from "./slashCommand";
import { MentionItem, createMentionSuggestion } from "./mentionSuggestion";
import { BlockNodeClass } from "./blockNodeClass";
import { BubbleMenuBar } from "./menus/BubbleMenuBar";
import { BlockHandle } from "./ui/BlockHandle";
import { BlockMenu } from "./menus/BlockMenu";

type BlockEditorProps = {
  value: EditorDocument;
  onChange: (next: EditorDocument) => void;
  onSave?: () => void;
  readonly?: boolean;
  mentionItems?: MentionItem[];
  onMentionClick?: (item: MentionItem) => void;
};

type BlockRange = {
  from: number;
  to: number;
};

function getBlockRange(editor: ReturnType<typeof useEditor>): BlockRange | null {
  if (!editor) return null;
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.isBlock) {
      return { from: $from.start(depth), to: $from.end(depth) };
    }
  }
  return null;
}

export function BlockEditor({
  value,
  onChange,
  readonly = false,
  mentionItems = [],
  onMentionClick
}: BlockEditorProps) {
  const lastContentRef = useRef("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeBlockRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [handlePos, setHandlePos] = useState({ top: 0, left: 0, visible: false });

  const roleItems = useMemo(
    () => mentionItems.filter((item) => item.entityType === "role"),
    [mentionItems]
  );
  const clueItems = useMemo(
    () => mentionItems.filter((item) => item.entityType === "clue"),
    [mentionItems]
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        history: {},
        hardBreak: {},
        dropcursor: false,
        gapcursor: false
      }),
      BlockNodeClass,
      DatabaseLikeBlock,
      Mention.extend({
        name: "roleMention",
        addAttributes() {
          return {
            ...this.parent?.(),
            entityType: { default: "role" }
          };
        }
      }).configure({
        HTMLAttributes: {
          class: "mention mention-role"
        },
        suggestion: createMentionSuggestion("@", roleItems),
        renderHTML(props: any) {
          const { node, HTMLAttributes } = props;
          return [
            "span",
            mergeAttributes(HTMLAttributes, {
              "data-mention": "true",
              "data-entity-id": node.attrs.id,
              "data-entity-type": node.attrs.entityType,
              "data-label": node.attrs.label
            }),
            `@${node.attrs.label}`
          ];
        },
        renderText({ node }) {
          return `@${node.attrs.label}`;
        }
      }),
      Mention.extend({
        name: "clueMention",
        addAttributes() {
          return {
            ...this.parent?.(),
            entityType: { default: "clue" }
          };
        }
      }).configure({
        HTMLAttributes: {
          class: "mention mention-clue"
        },
        suggestion: createMentionSuggestion("#", clueItems),
        renderHTML(props: any) {
          const { node, HTMLAttributes } = props;
          return [
            "span",
            mergeAttributes(HTMLAttributes, {
              "data-mention": "true",
              "data-entity-id": node.attrs.id,
              "data-entity-type": node.attrs.entityType,
              "data-label": node.attrs.label
            }),
            `#${node.attrs.label}`
          ];
        },
        renderText({ node }) {
          return `#${node.attrs.label}`;
        }
      }),
      SlashCommand
    ],
    [roleItems, clueItems]
  );

  const editor = useEditor({
    extensions,
    content: value.content,
    editable: !readonly,
    editorProps: {
      attributes: {
        class: "tiptap block-editor"
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement | null;
        if (!target || !onMentionClick) return false;
        const mentionEl = target.closest("[data-mention=\"true\"]") as HTMLElement | null;
        if (!mentionEl) return false;
        const entityId = mentionEl.dataset.entityId;
        const entityType = mentionEl.dataset.entityType as MentionItem["entityType"] | undefined;
        const label = mentionEl.dataset.label;
        if (!entityId || !entityType) return false;
        onMentionClick({ id: entityId, label: label || entityId, entityType });
        return true;
      }
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      lastContentRef.current = JSON.stringify(json);
      onChange(updateDocumentContent(value, json as Record<string, unknown>));
    }
  });

  const updateHandle = useCallback(() => {
    if (!editor || !containerRef.current) return;
    const range = getBlockRange(editor);
    if (!range) return;
    const domAtPos = editor.view.domAtPos(range.from).node as HTMLElement | Text | null;
    const element = (
      (domAtPos instanceof Text ? domAtPos.parentElement : domAtPos)?.closest(
        "[data-block-node=\"true\"]"
      ) ?? null
    ) as HTMLElement | null;

    if (activeBlockRef.current && activeBlockRef.current !== element) {
      activeBlockRef.current.classList.remove("is-active");
    }
    if (element && !element.classList.contains("is-active")) {
      element.classList.add("is-active");
    }
    activeBlockRef.current = element;

    const coords = editor.view.coordsAtPos(range.from);
    const containerRect = containerRef.current.getBoundingClientRect();
    const top = coords.top - containerRect.top;
    const left = coords.left - containerRect.left;
    setHandlePos({
      top,
      left,
      visible: editor.isEditable
    });
  }, [editor]);

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

  useEffect(() => {
    if (!editor) return;
    updateHandle();
    const onUpdate = () => updateHandle();
    editor.on("selectionUpdate", onUpdate);
    editor.on("transaction", onUpdate);
    window.addEventListener("resize", onUpdate);
    window.addEventListener("scroll", onUpdate, true);
    return () => {
      editor.off("selectionUpdate", onUpdate);
      editor.off("transaction", onUpdate);
      window.removeEventListener("resize", onUpdate);
      window.removeEventListener("scroll", onUpdate, true);
      activeBlockRef.current?.classList.remove("is-active");
    };
  }, [editor, updateHandle]);

  const insertBlockBelow = useCallback(() => {
    if (!editor) return;
    const range = getBlockRange(editor);
    if (!range) return;
    const insertPos = range.to + 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, { type: "paragraph" })
      .setTextSelection(insertPos + 1)
      .run();
  }, [editor]);

  const deleteCurrentBlock = useCallback(() => {
    if (!editor) return;
    const range = getBlockRange(editor);
    if (!range) return;
    editor.chain().focus().setTextSelection(range).deleteSelection().run();
  }, [editor]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full flex-col rounded-2xl border border-slate-100 bg-white/90 shadow-sm"
    >
      {editor && !readonly ? (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 120 }}
          shouldShow={({ editor }) => !editor.state.selection.empty}
        >
          <BubbleMenuBar editor={editor} />
        </BubbleMenu>
      ) : null}
      <BlockHandle
        top={handlePos.top}
        left={handlePos.left}
        visible={handlePos.visible && !readonly}
        onOpenMenu={() => setMenuOpen(true)}
        onInsert={insertBlockBelow}
      />
      <BlockMenu
        editor={editor}
        open={menuOpen}
        top={handlePos.top}
        left={handlePos.left}
        onClose={() => setMenuOpen(false)}
        onDelete={deleteCurrentBlock}
        onInsert={insertBlockBelow}
      />
      <div className="editor-scroll px-6 py-5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
