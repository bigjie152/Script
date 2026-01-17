"use client";

import { createSuggestionRenderer } from "./createSuggestionRenderer";

type MentionItem = {
  id: string;
  label: string;
  entityType: "role" | "clue" | "timeline";
};

const MENTION_ITEMS: MentionItem[] = [
  { id: "role-001", label: "角色：嫌疑人 A", entityType: "role" },
  { id: "role-002", label: "角色：受害者 B", entityType: "role" },
  { id: "clue-001", label: "线索：指纹", entityType: "clue" },
  { id: "clue-002", label: "线索：目击证词", entityType: "clue" },
  { id: "timeline-001", label: "时间线：案发夜", entityType: "timeline" }
];

export const mentionSuggestion = {
  items: ({ query }: { query: string }) => {
    if (!query) return MENTION_ITEMS;
    return MENTION_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
  },
  render: createSuggestionRenderer("mention-menu")
};
