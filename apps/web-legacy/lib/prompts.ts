const PROMPTS: Record<string, string> = {
  "derive/role.v1.md": "You are a role-derivation assistant. Return JSON only.",
  "check/consistency.v1.md":
    "You are a consistency-check assistant. Return JSON only."
};

export async function loadPrompt(relativePath: string) {
  const key = relativePath.replace(/^[\\/]+/, "");
  return PROMPTS[key] || "";
}
