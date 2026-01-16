import { EditorShell } from "../../../../../features/project-editor/EditorShell";

export const runtime = "edge";

const MODULES = ["overview", "truth", "roles", "clues", "timeline", "dm"] as const;

type ModuleKey = (typeof MODULES)[number];

export default async function EditorPage({
  params
}: {
  params: Promise<{ id: string; module: string }>;
}) {
  const resolved = await params;
  const moduleKey = MODULES.includes(resolved.module as ModuleKey)
    ? (resolved.module as ModuleKey)
    : "overview";

  return <EditorShell projectId={resolved.id} module={moduleKey} />;
}
