export const runtime = "edge";

import EditorApp from "@/ui/aistudio/editor/EditorApp";
import { ModuleType } from "@/ui/aistudio/editor/types/types";

const moduleMap: Record<string, ModuleType> = {
  overview: ModuleType.Overview,
  truth: ModuleType.Truth,
  roles: ModuleType.Characters,
  clues: ModuleType.Clues,
  timeline: ModuleType.Timeline,
  dm: ModuleType.Manual,
};

export default async function ProjectEditorModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const initialModule = moduleMap[module] ?? ModuleType.Overview;
  return <EditorApp initialModule={initialModule} />;
}
