import { getAIClient } from "../adapters/base.adapter";
import { extractJson } from "../utils/json";

export type DerivedCandidate = {
  title: string;
  summary?: string;
  content?: unknown;
  refs?: unknown;
  riskFlags?: string[];
  meta?: unknown;
};

type DeriveCandidatesInput = {
  prompt: string;
  project: { id: string; name?: string | null };
  truthSnapshot: { id: string; version?: number | null; content: unknown };
  actionType: string;
  intent?: string;
  context?: unknown;
};

function buildDocFromText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { type: "doc", content: [] };
  }
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: trimmed }]
      }
    ]
  };
}

function normalizeContent(item: Record<string, unknown>, fallback: string) {
  const content = item?.content;
  if (content && typeof content === "object") {
    return content;
  }
  if (typeof content === "string" && content.trim()) {
    return buildDocFromText(content);
  }
  return buildDocFromText(fallback);
}

export function parseDerivedCandidates(raw: string) {
  const parsed = extractJson<{
    items?: Array<Record<string, unknown>>;
    candidates?: Array<Record<string, unknown>>;
    suggestions?: Array<Record<string, unknown>>;
    roles?: Array<Record<string, unknown>>;
  }>(raw);
  const rawItems =
    parsed?.items ||
    parsed?.candidates ||
    parsed?.suggestions ||
    parsed?.roles ||
    [];

  const items = rawItems.map((item, index) => {
    const title = String(
      item?.title || item?.name || `候选${index + 1}`
    );
    const summary = item?.summary
      ? String(item.summary)
      : item?.detail
        ? String(item.detail)
        : item?.description
          ? String(item.description)
          : undefined;
    const flagsSource = (item as any)?.risk_flags ?? (item as any)?.riskFlags;
    const riskFlags = Array.isArray(flagsSource)
      ? flagsSource.map((flag: unknown) => String(flag))
      : undefined;
    return {
      title,
      summary,
      content: normalizeContent(item as Record<string, unknown>, summary || title),
      refs: item?.refs ?? undefined,
      riskFlags,
      meta: item
    } as DerivedCandidate;
  });

  return items;
}

function buildPayload(input: DeriveCandidatesInput) {
  return {
    action: `derive_${input.actionType}`,
    project: { id: input.project.id, name: input.project.name || undefined },
    truthSnapshot: {
      id: input.truthSnapshot.id,
      version: input.truthSnapshot.version ?? undefined,
      content: input.truthSnapshot.content
    },
    intent: input.intent,
    context: input.context
  };
}

export async function deriveCandidates(input: DeriveCandidatesInput) {
  const client = getAIClient("derive");
  const payload = buildPayload(input);

  const raw = await client.complete({
    system: input.prompt,
    user: JSON.stringify(payload, null, 2),
    temperature: 0.2
  });

  const items = parseDerivedCandidates(raw);
  return {
    items,
    provider: client.provider,
    model: client.model,
    raw
  };
}

export async function* deriveCandidatesStream(
  input: DeriveCandidatesInput
): AsyncGenerator<string, { items: DerivedCandidate[]; provider: string; model: string; raw: string }, void> {
  const client = getAIClient("derive");
  const payload = buildPayload(input);

  const stream =
    client.completeStream?.({
      system: input.prompt,
      user: JSON.stringify(payload, null, 2),
      temperature: 0.2
    }) ??
    (async function* () {
      const raw = await client.complete({
        system: input.prompt,
        user: JSON.stringify(payload, null, 2),
        temperature: 0.2
      });
      if (raw) yield raw;
    })();

  let raw = "";
  for await (const chunk of stream) {
    raw += chunk;
    if (chunk) {
      yield chunk;
    }
  }

  const items = parseDerivedCandidates(raw);
  return {
    items,
    provider: client.provider,
    model: client.model,
    raw
  };
}
