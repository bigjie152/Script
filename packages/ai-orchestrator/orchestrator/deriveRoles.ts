import { getAIClient } from "../adapters/base.adapter";
import { extractJson } from "../utils/json";

export type DerivedRole = {
  name: string;
  summary?: string;
  meta?: unknown;
};

type DeriveRolesInput = {
  prompt: string;
  project: { id: string; name?: string | null };
  truthSnapshot: { id: string; version?: number | null; content: unknown };
};

export async function deriveRoles(input: DeriveRolesInput) {
  const client = getAIClient("derive");
  const payload = {
    action: "derive_roles",
    project: { id: input.project.id, name: input.project.name || undefined },
    truthSnapshot: {
      id: input.truthSnapshot.id,
      version: input.truthSnapshot.version ?? undefined,
      content: input.truthSnapshot.content
    }
  };

  const raw = await client.complete({
    system: input.prompt,
    user: JSON.stringify(payload, null, 2),
    temperature: 0.2
  });

  const parsed = extractJson<{ roles?: Array<Record<string, unknown>> }>(raw);
  const rolesInput = Array.isArray(parsed?.roles) ? parsed?.roles : [];

  const roles = rolesInput.map((role, index) => ({
    name: String(role?.name || `Role ${index + 1}`),
    summary: role?.summary ? String(role.summary) : undefined,
    meta: role
  }));

  return {
    roles,
    provider: client.provider,
    model: client.model,
    raw
  };
}
