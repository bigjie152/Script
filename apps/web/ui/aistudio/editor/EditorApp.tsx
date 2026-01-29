"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Sidebar, { NavStructure } from "./components/Sidebar";
import Header from "./components/Header";
import RightPanel from "./components/RightPanel";
import Overview from "./components/Modules/Overview";
import Truth from "./components/Modules/Truth";
import Roles from "./components/Modules/Roles";
import Clues from "./components/Modules/Clues";
import Timeline from "./components/Modules/Timeline";
import Manual from "./components/Modules/Manual";
import { resolveModuleKey, MODULE_CONFIG_MAP } from "@/modules/modules.config";
import { EditorModuleKey } from "@/types/editorDocument";
import { useTruthDocument } from "@/hooks/useTruthDocument";
import { useModuleDocument } from "@/hooks/useModuleDocument";
import { useModuleCollection } from "@/hooks/useModuleCollection";
import { useProjectMeta } from "@/hooks/useProjectMeta";
import { MentionItem } from "@/editors/tiptap/mentionSuggestion";

type SaveState = "idle" | "saving" | "success" | "error";

type RouteParams = {
  projectId?: string;
  module?: string;
};

const EditorApp: React.FC = () => {
  const params = useParams<RouteParams>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = typeof params.projectId === "string" ? params.projectId : "";
  const moduleKey = resolveModuleKey(
    typeof params.module === "string" ? params.module : null
  );
  const entryId = searchParams.get("entry") ?? undefined;

  const truthState = useTruthDocument(projectId);
  const overviewDoc = useModuleDocument(
    projectId,
    moduleKey === "overview" ? "overview" : null
  );
  const projectMeta = useProjectMeta(
    projectId,
    truthState.project,
    truthState.refresh
  );

  const roles = useModuleCollection(projectId, "roles", "角色");
  const clues = useModuleCollection(projectId, "clues", "线索");
  const timeline = useModuleCollection(projectId, "timeline", "时间线");
  const manual = useModuleCollection(projectId, "dm", "DM 手册");

  const mentionItems = useMemo<MentionItem[]>(
    () => [
      ...roles.entries.map((entry) => ({
        id: entry.id,
        label: entry.name,
        entityType: "role" as const
      })),
      ...clues.entries.map((entry) => ({
        id: entry.id,
        label: entry.name,
        entityType: "clue" as const
      }))
    ],
    [roles.entries, clues.entries]
  );

  const navStructure = useMemo<NavStructure>(
    () => ({
      roles: roles.entries.map((entry) => ({ id: entry.id, label: entry.name })),
      clues: clues.entries.map((entry) => ({ id: entry.id, label: entry.name })),
      timeline: [],
      dm: []
    }),
    [roles.entries, clues.entries]
  );

  useEffect(() => {
    if (!projectId || params.module) return;
    router.replace(`/projects/${projectId}/editor/overview`);
  }, [projectId, params.module, router]);

  useEffect(() => {
    if (!entryId) return;
    if (moduleKey === "roles") roles.setActiveEntry(entryId);
    if (moduleKey === "clues") clues.setActiveEntry(entryId);
  }, [
    entryId,
    moduleKey,
    roles.setActiveEntry,
    clues.setActiveEntry
  ]);

  const navigate = useCallback(
    (module: EditorModuleKey, entry?: string) => {
      if (!projectId) return;
      const base = `/projects/${projectId}/editor/${module}`;
      router.push(entry ? `${base}?entry=${entry}` : base);
    },
    [projectId, router]
  );

  const createEntry = useCallback(
    (module: EditorModuleKey) => {
      if (!projectId) return null;
      let nextId: string | null = null;
      if (module === "roles") nextId = roles.createEntry();
      if (module === "clues") nextId = clues.createEntry();
      if (nextId) navigate(module, nextId);
      return nextId;
    },
    [projectId, roles, clues, navigate]
  );

  const renameEntry = useCallback(
    async (module: EditorModuleKey, entryId: string, name: string) => {
      if (!projectId) return false;
      const target =
        module === "roles" ? roles : module === "clues" ? clues : null;
      if (!target) return false;
      target.renameEntry(entryId, name);
      const ok = await target.save();
      if (!ok) {
        target.refresh();
        return false;
      }
      return true;
    },
    [projectId, roles, clues]
  );

  const deleteEntry = useCallback(
    async (module: EditorModuleKey, entryId: string) => {
      if (!projectId) return false;
      const target =
        module === "roles" ? roles : module === "clues" ? clues : null;
      if (!target) return false;
      target.removeEntry(entryId);
      const ok = await target.save();
      if (!ok) {
        target.refresh();
        return false;
      }
      const nextEntry = target.activeEntryId ?? undefined;
      navigate(module, nextEntry || undefined);
      return true;
    },
    [projectId, roles, clues, navigate]
  );

  const handleMentionClick = useCallback(
    (item: MentionItem) => {
      if (item.entityType === "role") {
        navigate("roles", item.id);
        return;
      }
      if (item.entityType === "clue") {
        navigate("clues", item.id);
      }
    },
    [navigate]
  );

  const projectStatusLabel = useMemo(() => {
    const status = projectMeta.form.status;
    if (status === "In Progress") return "进行中";
    if (status === "Completed") return "已完成";
    return "草稿";
  }, [projectMeta.form.status]);

  const truthLocked = truthState.truth?.status === "LOCKED";
  const truthStatusLabel = truthLocked ? "已锁定" : "草稿";

  const headerModuleLabel = MODULE_CONFIG_MAP[moduleKey]?.label ?? "概览";

  const combinedSaveState = useMemo<SaveState>(() => {
    if (moduleKey === "overview") {
      if (overviewDoc.saveState === "saving" || projectMeta.saveState === "saving") return "saving";
      if (overviewDoc.saveState === "error" || projectMeta.saveState === "error") return "error";
      if (overviewDoc.saveState === "success" || projectMeta.saveState === "success") return "success";
      return "idle";
    }
    if (moduleKey === "truth") return truthState.saveState;
    if (moduleKey === "roles") return roles.saveState;
    if (moduleKey === "clues") return clues.saveState;
    if (moduleKey === "timeline") return timeline.saveState;
    if (moduleKey === "dm") return manual.saveState;
    return "idle";
  }, [moduleKey, overviewDoc.saveState, projectMeta.saveState, truthState.saveState, roles.saveState, clues.saveState, timeline.saveState, manual.saveState]);

  const handleSave = useCallback(async () => {
    if (moduleKey === "overview") {
      const results = await Promise.all([
        overviewDoc.hasUnsaved ? overviewDoc.save() : Promise.resolve(true),
        projectMeta.hasUnsaved ? projectMeta.save() : Promise.resolve(true)
      ]);
      return results.every(Boolean);
    }
    if (moduleKey === "truth") return truthState.save();
    if (moduleKey === "roles") return roles.save();
    if (moduleKey === "clues") return clues.save();
    if (moduleKey === "timeline") return timeline.save();
    if (moduleKey === "dm") return manual.save();
    return false;
  }, [moduleKey, overviewDoc, projectMeta, truthState, roles, clues, timeline, manual]);

  if (!projectId) {
    return <div className="p-6 text-sm text-gray-500">项目不存在或链接无效。</div>;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      <Sidebar
        activeModule={moduleKey}
        activeEntryId={entryId}
        onNavigate={navigate}
        onCreateEntry={createEntry}
        onRenameEntry={renameEntry}
        onDeleteEntry={deleteEntry}
        structure={navStructure}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          moduleLabel={headerModuleLabel}
          projectTitle={truthState.project?.name || "未命名剧本"}
          projectStatusLabel={projectStatusLabel}
          truthStatusLabel={truthStatusLabel}
          truthLocked={truthLocked}
          saveState={combinedSaveState}
          onSave={handleSave}
          onBack={() => router.push("/workspace")}
        />

        <main className="flex-1 overflow-y-auto px-6 py-5 md:px-7 md:py-6">
          {moduleKey === "overview" && (
            <Overview
              projectMeta={projectMeta}
              overviewDoc={overviewDoc}
              latestSnapshotId={truthState.latestSnapshotId}
              createdAt={truthState.project?.createdAt ?? null}
              updatedAt={truthState.project?.updatedAt ?? null}
            />
          )}
          {moduleKey === "truth" && (
            <Truth
              truthState={truthState}
              latestSnapshotId={truthState.latestSnapshotId}
              mentionItems={mentionItems}
              onMentionClick={handleMentionClick}
            />
          )}
          {moduleKey === "roles" && (
            <Roles
              collection={roles}
              entryId={entryId}
              onSelectEntry={(id) => navigate("roles", id)}
              onCreateEntry={() => createEntry("roles")}
              onRenameEntry={(id, name) => renameEntry("roles", id, name)}
            />
          )}
          {moduleKey === "clues" && (
            <Clues
              collection={clues}
              entryId={entryId}
              onSelectEntry={(id) => navigate("clues", id)}
              onCreateEntry={() => createEntry("clues")}
            />
          )}
          {moduleKey === "timeline" && <Timeline collection={timeline} />}
          {moduleKey === "dm" && <Manual collection={manual} />}
        </main>
      </div>

      <RightPanel />
    </div>
  );
};

export default EditorApp;
