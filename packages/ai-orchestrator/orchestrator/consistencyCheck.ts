import { getAIClient } from "../adapters/base.adapter";
import { extractJson } from "../utils/json";
import type { DerivedRole } from "./deriveRoles";

export type ConsistencyIssue = {
  type: string;
  severity: string;
  title: string;
  description?: string;
  refs?: unknown;
};

type ConsistencyInput = {
  prompt: string;
  project: { id: string; name?: string | null };
  truthSnapshot: { id: string; version?: number | null; content: unknown };
  roles: DerivedRole[];
};

export async function consistencyCheck(input: ConsistencyInput) {
  const client = getAIClient();
  const payload = {
    action: "consistency_check",
    project: { id: input.project.id, name: input.project.name || undefined },
    truthSnapshot: {
      id: input.truthSnapshot.id,
      version: input.truthSnapshot.version ?? undefined,
      content: input.truthSnapshot.content
    },
    roles: input.roles
  };

  const raw = await client.complete({
    system: input.prompt,
    user: JSON.stringify(payload, null, 2),
    temperature: 0.2
  });

  const parsed = extractJson<{ issues?: Array<Record<string, unknown>> }>(raw);
  const issuesInput = Array.isArray(parsed?.issues) ? parsed?.issues : [];

  const issues = issuesInput.map((issue, index) => ({
    type: String(issue?.type || "consistency"),
    severity: String(issue?.severity || "medium"),
    title: String(issue?.title || `Issue ${index + 1}`),
    description: issue?.description ? String(issue.description) : undefined,
    refs: issue?.refs ?? undefined
  }));

  return {
    issues,
    provider: client.provider,
    model: client.model,
    raw
  };
}
