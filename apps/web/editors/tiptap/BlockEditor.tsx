"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { mergeAttributes } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { EditorDocument } from "../../types/editorDocument";
import { updateDocumentContent } from "../adapters/plainTextAdapter";
import { DatabaseLikeBlock } from "./databaseLikeBlock";
import { SlashCommand } from "./slashCommand";
import { MentionItem, createMentionSuggestion } from "./mentionSuggestion";
import { BlockNodeClass } from "./blockNodeClass";
import { BubbleMenuBar } from "./menus/BubbleMenuBar";
import { BlockHandle } from "./ui/BlockHandle";
import { BlockMenu } from "./menus/BlockMenu";
import { FontSize } from "./fontSize";

type BlockEditorProps = {
  value: EditorDocument;
  onChange: (next: EditorDocument) => void;
  onSave?: () => void | Promise<void>;
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
  onSave,
  readonly = false,
  mentionItems = [],
  onMentionClick
}: BlockEditorProps) {
  const debugEnabled = process.env.NEXT_PUBLIC_EDITOR_DEBUG === "true";
  const statsRef = useRef<{ created: number; destroyed: number; refresh: number }>({
    created: 0,
    destroyed: 0,
    refresh: 0
  });
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
  const timelineItems = useMemo(
    () => mentionItems.filter((item) => item.entityType === "timeline"),
    [mentionItems]
  );

  const extensions = useMemo(() => {
    if (debugEnabled) {
      statsRef.current.refresh += 1;
      if (typeof window !== "undefined") {
        const record = ((window as any).__editorStats ||= {
          created: 0,
          destroyed: 0,
          refresh: 0
        });
        record.refresh = statsRef.current.refresh;
      }
      console.info("[editor] extensions refreshed", {
        module: value.module,
        refresh: statsRef.current.refresh
      });
    }
    return [
      StarterKit.configure({
        history: {},
        hardBreak: {},
        dropcursor: false,
        gapcursor: false
      }),
      TextStyle,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-indigo-600 underline underline-offset-2"
        }
      }),
      FontFamily.configure({
        types: ["textStyle"]
      }),
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Placeholder.configure({
        placeholder: "写下你的故事背景，这里是灵感的起点..."
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
      Mention.extend({
        name: "timelineMention",
        addAttributes() {
          return {
            ...this.parent?.(),
            entityType: { default: "timeline" }
          };
        }
      }).configure({
        HTMLAttributes: {
          class: "mention mention-timeline"
        },
        suggestion: createMentionSuggestion("⏱", timelineItems),
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
            `⏱${node.attrs.label}`
          ];
        },
        renderText({ node }) {
          return `⏱${node.attrs.label}`;
        }
      }),
      SlashCommand
    ];
  }, [roleItems, clueItems, timelineItems, debugEnabled, value.module]);

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      const json = editor.getJSON();
      lastContentRef.current = JSON.stringify(json);
      onChange(updateDocumentContent(value, json as Record<string, unknown>));
    },
    [onChange, value]
  );

  const editorProps = useMemo(
    () => ({
      attributes: {
        class:
          "tiptap block-editor min-h-[560px] text-[16px] leading-7 text-slate-800 focus:outline-none prose prose-slate prose-lg max-w-none"
      },
      handleKeyDown: (_view: unknown, event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          event.stopPropagation();
          void onSave?.();
          return true;
        }
        return false;
      },
      handleClick: (_view: unknown, _pos: number, event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target || !onMentionClick) return false;
        const mentionEl = target.closest("[data-mention=\"true\"]") as HTMLElement | null;
        if (!mentionEl) return false;
        const entityId = mentionEl.dataset.entityId;
        const entityType = mentionEl.dataset.entityType as
          | MentionItem["entityType"]
          | undefined;
        const label = mentionEl.dataset.label;
        if (!entityId || !entityType) return false;
        onMentionClick({ id: entityId, label: label || entityId, entityType });
        return true;
      }
    }),
    [onMentionClick, onSave]
  );

  const editor = useEditor({
    extensions,
    content: value.content,
    editable: !readonly,
    shouldRerenderOnTransaction: false,
    editorProps,
    onUpdate: handleUpdate
  });

  useEffect(() => {
    if (!editor) return;
    if (debugEnabled) {
      statsRef.current.created += 1;
      if (typeof window !== "undefined") {
        const record = ((window as any).__editorStats ||= {
          created: 0,
          destroyed: 0,
          refresh: 0
        });
        record.created = statsRef.current.created;
      }
      console.info("[editor] create", {
        module: value.module,
        projectId: value.projectId,
        created: statsRef.current.created
      });
    }
    return () => {
      if (!debugEnabled) return;
      statsRef.current.destroyed += 1;
      if (typeof window !== "undefined") {
        const record = ((window as any).__editorStats ||= {
          created: 0,
          destroyed: 0,
          refresh: 0
        });
        record.destroyed = statsRef.current.destroyed;
      }
      console.info("[editor] destroy", {
        module: value.module,
        projectId: value.projectId,
        destroyed: statsRef.current.destroyed
      });
    };
  }, [editor, debugEnabled, value.module, value.projectId]);

  const updateHandle = useCallback(() => {
    if (!editor || !containerRef.current) return;
    if ((editor as any).isDestroyed) return;
    if (!containerRef.current.contains(editor.view.dom)) return;
    const range = getBlockRange(editor);
    if (!range) return;
    let domAtPos: HTMLElement | Text | null = null;
    try {
      domAtPos = editor.view.domAtPos(range.from).node as HTMLElement | Text | null;
    } catch {
      return;
    }
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
    if ((editor as any).isDestroyed) return;
    if (!editor.view?.dom?.isConnected) return;
    try {
      if (editor.isEditable !== !readonly) {
        editor.setEditable(!readonly);
      }
    } catch (err) {
      console.error("[editor] setEditable failed", err);
    }
  }, [editor, readonly]);

  useEffect(() => {
    if (!editor) return;
    const serialized = JSON.stringify(value.content ?? {});
    if (serialized === lastContentRef.current) return;
    if ((editor as any).isDestroyed) return;
    if (!editor.view?.dom?.isConnected) return;
    try {
      editor.commands.setContent(value.content ?? { type: "doc", content: [] }, false);
      lastContentRef.current = serialized;
    } catch (err) {
      console.error("[editor] setContent failed", err);
    }
  }, [editor, value.content]);

  useEffect(() => {
    if (!editor) return;
    const handler = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      event.stopPropagation();
      void onSave?.();
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [editor, onSave]);


  useEffect(() => {
    setMenuOpen(false);
    activeBlockRef.current?.classList.remove("is-active");
    activeBlockRef.current = null;
  }, [readonly, value.content]);

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
      className="relative flex h-full w-full flex-col bg-white"
    >
      {editor && !readonly ? (
        <BubbleMenu
          editor={editor}
          tippyOptions={{
            duration: 120,
            appendTo: () => containerRef.current || document.body
          }}
          shouldShow={({ editor }) =>
            editor.isFocused && !editor.state.selection.empty
          }
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
      <div className="editor-scroll flex-1 overflow-y-auto px-6 py-5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

