import { EditorDocument, EditorModuleKey } from "../../types/editorDocument";

type TruthNode = {
  type?: string;
  content?: TruthNode[];
  text?: string;
  attrs?: Record<string, unknown>;
};

type DocumentMeta = {
  projectId: string;
  module: EditorModuleKey;
  updatedAt?: string | null;
};

const EMPTY_DOC = { type: "doc", content: [] } as Record<string, unknown>;

function collectText(node: TruthNode | undefined): string {
  if (!node) return "";
  if (node.type === "roleMention") {
    const label = node.attrs?.label;
    return label ? `@${label}` : "@角色";
  }
  if (node.type === "clueMention") {
    const label = node.attrs?.label;
    return label ? `#${label}` : "#线索";
  }
  if (node.type === "mention") {
    const label = node.attrs?.label;
    return label ? `@${label}` : "@提及";
  }
  if (node.type === "databaseLike") {
    return "〔结构化区块〕";
  }
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map((child) => collectText(child)).join("");
  }
  return "";
}

export function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!content || typeof content !== "object") return "";

  const node = content as TruthNode;

  if (typeof node.text === "string") {
    return node.text;
  }

  if (node.type === "doc" && Array.isArray(node.content)) {
    const paragraphs = node.content
      .map((child) => collectText(child))
      .filter((item) => item.trim().length > 0);
    if (paragraphs.length) {
      return paragraphs.join("\n\n");
    }
  }

  if (Array.isArray(node.content)) {
    const pieces = node.content
      .map((child) => collectText(child))
      .filter((item) => item.trim().length > 0);
    if (pieces.length) {
      return pieces.join("\n\n");
    }
  }

  return "";
}

export function buildDocFromText(text: string): Record<string, unknown> {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { ...EMPTY_DOC };
  }

  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line }]
    }))
  };
}

export function normalizeContent(content: unknown): Record<string, unknown> {
  if (typeof content === "string") {
    return buildDocFromText(content);
  }

  if (!content || typeof content !== "object") {
    return { ...EMPTY_DOC };
  }

  return content as Record<string, unknown>;
}

export function createEmptyDocument(
  projectId: string,
  module: EditorModuleKey
): EditorDocument {
  return {
    projectId,
    module,
    content: { ...EMPTY_DOC },
    text: "",
    updatedAt: null
  };
}

export function deserializeDocument(
  content: unknown,
  meta: DocumentMeta
): EditorDocument {
  const normalized = normalizeContent(content);
  return {
    projectId: meta.projectId,
    module: meta.module,
    content: normalized,
    text: extractTextFromContent(normalized),
    updatedAt: meta.updatedAt ?? null
  };
}

export function serializeDocument(document: EditorDocument): Record<string, unknown> {
  return normalizeContent(document.content);
}

export function updateDocumentText(
  document: EditorDocument,
  nextText: string
): EditorDocument {
  return {
    ...document,
    text: nextText,
    content: buildDocFromText(nextText)
  };
}

export function updateDocumentContent(
  document: EditorDocument,
  nextContent: Record<string, unknown>
): EditorDocument {
  const normalized = normalizeContent(nextContent);
  return {
    ...document,
    content: normalized,
    text: extractTextFromContent(normalized)
  };
}
