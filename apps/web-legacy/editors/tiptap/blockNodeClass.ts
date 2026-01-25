"use client";

import { Extension } from "@tiptap/core";

const BLOCK_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "listItem",
  "codeBlock"
];

export const BlockNodeClass = Extension.create({
  name: "blockNodeClass",

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          class: {
            default: null,
            renderHTML: (attributes) => {
              const existing = attributes.class ? String(attributes.class) : "";
              const nextClass = ["block-node", existing].filter(Boolean).join(" ");
              return {
                class: nextClass,
                "data-block-node": "true"
              };
            }
          }
        }
      }
    ];
  }
});
