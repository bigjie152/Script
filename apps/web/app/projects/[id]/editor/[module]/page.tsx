import { EditorShell } from "../../../../../features/project-editor/EditorShell";
import { resolveModuleKey } from "../../../../../modules/modules.config";

export const runtime = "edge";

export default async function EditorPage({
  params
}: {
  params: Promise<{ id: string; module: string }>;
}) {
  const resolved = await params;
  const moduleKey = resolveModuleKey(resolved.module);

  return <EditorShell projectId={resolved.id} module={moduleKey} />;
}
