import { EditorShell } from "../../../../../features/project-editor/EditorShell";

const MODULES = ["overview", "truth", "roles", "clues", "timeline", "dm"] as const;

type ModuleKey = (typeof MODULES)[number];

export default function EditorPage({
  params
}: {
  params: { id: string; module: string };
}) {
  const moduleKey = MODULES.includes(params.module as ModuleKey)
    ? (params.module as ModuleKey)
    : "overview";

  return <EditorShell projectId={params.id} module={moduleKey} />;
}
