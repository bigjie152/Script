export type EditorDocument = {
  text: string;
};

export type TruthContent = Record<string, unknown>;

type TruthNode = {
  type?: string;
  content?: TruthNode[];
  text?: string;
};

function collectText(node: TruthNode | undefined): string {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map((child) => collectText(child)).join("");
  }
  return "";
}

export function fromTruthContent(content: unknown): EditorDocument {
  if (typeof content === "string") {
    return { text: content };
  }

  if (!content || typeof content !== "object") {
    return { text: "" };
  }

  const node = content as TruthNode;

  if (typeof node.text === "string") {
    return { text: node.text };
  }

  if (node.type === "doc" && Array.isArray(node.content)) {
    const paragraphs = node.content
      .map((child) => collectText(child))
      .filter((item) => item.trim().length > 0);
    if (paragraphs.length) {
      return { text: paragraphs.join("\n\n") };
    }
  }

  if (Array.isArray(node.content)) {
    const pieces = node.content
      .map((child) => collectText(child))
      .filter((item) => item.trim().length > 0);
    if (pieces.length) {
      return { text: pieces.join("\n\n") };
    }
  }

  return { text: "" };
}

export function toTruthContent(document: EditorDocument): TruthContent {
  const lines = document.text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { type: "doc", content: [] };
  }

  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line }]
    }))
  };
}
