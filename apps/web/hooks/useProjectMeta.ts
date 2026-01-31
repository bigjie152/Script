import { useCallback, useEffect, useMemo, useState } from "react";
import { Project, updateProject } from "../services/projectApi";
import { normalizeContent } from "../editors/adapters/plainTextAdapter";

export type ProjectMetaForm = {
  name: string;
  description: string;
  overviewDoc: Record<string, unknown>;
  players: string;
  genre: string;
  status: "Draft" | "In Progress" | "Completed";
  version: string;
};

type SaveState = "idle" | "saving" | "success" | "error";

export function useProjectMeta(
  projectId: string,
  project: Project | null,
  refresh: () => void
) {
  const [form, setForm] = useState<ProjectMetaForm>({
    name: "",
    description: "",
    overviewDoc: { type: "doc", content: [] },
    players: "",
    genre: "",
    status: "Draft",
    version: "v0.1"
  });
  const [baseline, setBaseline] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) return;
    const meta = (project.meta || {}) as Record<string, unknown>;
    const next: ProjectMetaForm = {
      name: project.name || "",
      description: project.description || "",
      overviewDoc: normalizeContent(meta.overviewDoc),
      players: typeof meta.players === "string" ? meta.players : "",
      genre: typeof meta.genre === "string" ? meta.genre : "",
      status:
        meta.status === "In Progress" || meta.status === "Completed"
          ? meta.status
          : "Draft",
      version: typeof meta.version === "string" ? meta.version : "v0.1"
    };
    setForm(next);
    setBaseline(JSON.stringify(next));
    setSaveState("idle");
    setSaveError(null);
  }, [project?.id, project?.name, project?.description, project?.meta]);

  useEffect(() => {
    if (saveState !== "success") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 1200);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const hasUnsaved = useMemo(
    () => JSON.stringify(form) !== baseline,
    [form, baseline]
  );

  const updateField = useCallback(
    (key: keyof ProjectMetaForm, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (saveState === "error") {
        setSaveState("idle");
        setSaveError(null);
      }
    },
    [saveState]
  );

  const save = useCallback(async () => {
    setSaveState("saving");
    setSaveError(null);
    try {
      await updateProject(projectId, {
        name: form.name,
        description: form.description,
        meta: {
          overviewDoc: normalizeContent(form.overviewDoc),
          players: form.players,
          genre: form.genre,
          status: form.status,
          version: form.version
        }
      });
      setBaseline(JSON.stringify(form));
      setSaveState("success");
      refresh();
      return true;
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "保存失败，请重试");
      return false;
    }
  }, [projectId, form, refresh]);

  return {
    project,
    form,
    updateField,
    setForm,
    save,
    saveState,
    saveError,
    hasUnsaved
  };
}
