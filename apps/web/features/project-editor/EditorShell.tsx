"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorSurface } from "../../components/editor/EditorSurface";
import { Button } from "../../components/common/Button";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { EmptyState } from "../../components/common/EmptyState";
import { TabGroup } from "../../components/common/TabGroup";
import { useProject } from "../../hooks/useProject";
import { deriveRoles, checkConsistency } from "../../services/aiApi";
import { lockTruth, updateTruth } from "../../services/truthApi";
import { AIPanel } from "../ai-panel/AIPanel";
import { IssuePanel } from "../issue-panel/IssuePanel";

const MODULES = [
  { key: "overview", label: "Overview" },
  { key: "truth", label: "Truth" },
  { key: "roles", label: "Roles" },
  { key: "clues", label: "Clues" },
  { key: "timeline", label: "Timeline" },
  { key: "dm", label: "DM Guide" }
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

type EditorShellProps = {
  projectId: string;
  module: ModuleKey;
};

export function EditorShell({ projectId, module }: EditorShellProps) {
  const router = useRouter();
  const { project, truth, latestSnapshotId, loading, error, refresh } =
    useProject(projectId);
  const [tab, setTab] = useState("ai");
  const [content, setContent] = useState<Record<string, unknown>>({
    type: "doc",
    content: []
  });
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [truthStatus, setTruthStatus] = useState<string>("DRAFT");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState({
    save: false,
    lock: false,
    derive: false,
    check: false
  });
  const [issueRefresh, setIssueRefresh] = useState(0);
  const [baselineContent, setBaselineContent] = useState("");
  const [hasUnsaved, setHasUnsaved] = useState(false);

  useEffect(() => {
    const nextContent = truth?.content ?? { type: "doc", content: [] };
    setContent(nextContent as Record<string, unknown>);
    if (truth?.status) setTruthStatus(truth.status);
    if (latestSnapshotId) setSnapshotId(latestSnapshotId);
    const nextBaseline = JSON.stringify(nextContent ?? {});
    setBaselineContent(nextBaseline);
    setHasUnsaved(false);
  }, [truth, latestSnapshotId]);

  useEffect(() => {
    if (module !== "truth") {
      setHasUnsaved(false);
      return;
    }
    const current = JSON.stringify(content ?? {});
    setHasUnsaved(current !== baselineContent);
  }, [content, baselineContent, module]);

  const moduleLabel = useMemo(() => {
    return MODULES.find((item) => item.key === module)?.label || "Overview";
  }, [module]);

  const isLocked = truthStatus === "LOCKED";

  const handleBack = () => {
    if (module === "truth" && hasUnsaved) {
      const ok = window.confirm("You have unsaved changes. Leave anyway?");
      if (!ok) return;
    }
    router.push("/workspace");
  };

  const handleSave = async () => {
    setActionError(null);
    if (isLocked) {
      setActionError("Truth is locked. Unlock to edit.");
      return;
    }
    setBusy((s) => ({ ...s, save: true }));
    try {
      const result = await updateTruth(projectId, content);
      setTruthStatus(result.status);
      setBaselineContent(JSON.stringify(content ?? {}));
      setHasUnsaved(false);
      refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Save failed, please retry"
      );
    } finally {
      setBusy((s) => ({ ...s, save: false }));
    }
  };

  const handleLock = async () => {
    setActionError(null);
    if (isLocked) {
      setActionError("Truth is already locked.");
      return;
    }
    setBusy((s) => ({ ...s, lock: true }));
    try {
      const result = await lockTruth(projectId);
      setSnapshotId(result.truthSnapshotId);
      setTruthStatus(result.status);
      refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Lock failed, please retry"
      );
    } finally {
      setBusy((s) => ({ ...s, lock: false }));
    }
  };

  const handleDeriveRoles = async () => {
    setActionError(null);
    if (!snapshotId) {
      setActionError("Lock Truth first.");
      return;
    }
    setBusy((s) => ({ ...s, derive: true }));
    try {
      await deriveRoles(projectId, snapshotId);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Derive failed, please retry"
      );
    } finally {
      setBusy((s) => ({ ...s, derive: false }));
    }
  };

  const handleCheckConsistency = async () => {
    setActionError(null);
    if (!snapshotId) {
      setActionError("Lock Truth first.");
      return;
    }
    setBusy((s) => ({ ...s, check: true }));
    try {
      await checkConsistency(projectId, snapshotId);
      setIssueRefresh((v) => v + 1);
      setTab("issues");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Check failed, please retry"
      );
    } finally {
      setBusy((s) => ({ ...s, check: false }));
    }
  };

  const handleNav = (next: ModuleKey) => {
    router.push(`/projects/${projectId}/editor/${next}`);
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">
            {project?.name || "Project"}
          </div>
          <div className="text-xs text-muted">
            {hasUnsaved ? "Unsaved changes" : "All changes saved"}
          </div>
        </div>
        <Button onClick={handleBack}>Back to Workspace</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="glass-panel-strong h-fit p-4">
          <div className="text-xs text-muted">Modules</div>
          <div className="mt-4 space-y-1">
            {MODULES.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  item.key === module
                    ? "bg-white text-ink shadow-soft"
                    : "text-muted hover:bg-white/50 hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-6 text-xs text-muted">
            Project: {project?.name || "Loading..."}
          </div>
        </aside>

        <main className="space-y-4">
          <div className="glass-panel-strong flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div>
              <div className="text-lg font-semibold">{moduleLabel}</div>
              <div className="text-xs text-muted">Editor</div>
            </div>
            {module === "truth" ? (
              <Button onClick={handleSave} loading={busy.save} disabled={isLocked}>
                Save Truth
              </Button>
            ) : null}
          </div>

          {loading ? (
            <EmptyState title="Loading..." description="Loading project data" />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : module === "overview" ? (
            <div className="glass-panel-strong px-8 py-6">
              <div className="text-xl font-semibold">
                {project?.name || "Untitled"}
              </div>
              <div className="mt-2 text-sm text-muted">
                {project?.description || "No description"}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-muted">
                <div>
                  <div className="text-xs">Created</div>
                  <div className="mt-1 text-ink">
                    {project?.createdAt || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs">Updated</div>
                  <div className="mt-1 text-ink">
                    {project?.updatedAt || "-"}
                  </div>
                </div>
              </div>
            </div>
          ) : module === "truth" ? (
            <EditorSurface
              content={content}
              onChange={setContent}
              editable={!isLocked}
            />
          ) : (
            <EmptyState
              title="Module not ready"
              description="Only Truth editing is enabled for MVP."
            />
          )}
        </main>

        <aside className="space-y-4">
          <TabGroup
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "ai", label: "AI Panel" },
              { key: "issues", label: "Issues" }
            ]}
          />
          {actionError ? <ErrorBanner message={actionError} /> : null}
          {tab === "ai" ? (
            <AIPanel
              truthStatus={truthStatus}
              onLock={handleLock}
              onDeriveRoles={handleDeriveRoles}
              onCheckConsistency={handleCheckConsistency}
              loading={{
                lock: busy.lock,
                derive: busy.derive,
                check: busy.check
              }}
            />
          ) : (
            <IssuePanel
              projectId={projectId}
              truthSnapshotId={snapshotId}
              refreshToken={issueRefresh}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
