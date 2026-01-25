"use client";

import { EditorDocument } from "../types/editorDocument";
import { BlockEditor } from "./tiptap/BlockEditor";
import { MentionItem } from "./tiptap/mentionSuggestion";

type DocumentEditorProps = {
  value: EditorDocument;
  onChange: (next: EditorDocument) => void;
  onSave?: () => void;
  readonly?: boolean;
  mentionItems?: MentionItem[];
  onMentionClick?: (item: MentionItem) => void;
};

export function DocumentEditor({
  value,
  onChange,
  onSave,
  readonly = false,
  mentionItems = [],
  onMentionClick
}: DocumentEditorProps) {
  return (
    <BlockEditor
      value={value}
      onChange={onChange}
      onSave={onSave}
      readonly={readonly}
      mentionItems={mentionItems}
      onMentionClick={onMentionClick}
    />
  );
}
