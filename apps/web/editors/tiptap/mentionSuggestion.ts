"use client";

import { createSuggestionRenderer } from "./createSuggestionRenderer";

export type MentionItem = {
  id: string;
  label: string;
  entityType: "role" | "clue" | "timeline";
  description?: string;
};

export function createMentionSuggestion(trigger: string, items: MentionItem[]) {
  return {
    char: trigger,
    items: ({ query }: { query: string }) => {
      if (!query) return items;
      const normalized = query.toLowerCase();
      return items.filter((item) =>
        item.label.toLowerCase().includes(normalized)
      );
    },
    render: createSuggestionRenderer("mention-menu")
  };
}
