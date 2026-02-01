import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db, schema } from "./db";

const REQUIRED_MODULES = ["story", "roles", "clues", "timeline", "dm"] as const;
const ISSUE_SOURCE = "publish";

type PublishIssueSummary = {
  id: string;
  type: string;
  title: string;
};

export type PublishGateResult = {
  ok: boolean;
  truthSnapshotId: string | null;
  missingModules: string[];
  needsReviewModules: string[];
  p0IssueCount: number;
  p0Issues: PublishIssueSummary[];
};

function collectEntries(
  docs: Array<{ module: string; content: unknown }>,
  moduleKey: string
) {
  const doc = docs.find((item) => item.module === moduleKey);
  const content = doc?.content as Record<string, unknown> | undefined;
  if (content && content.kind === "collection" && Array.isArray((content as any).entries)) {
    return (content as any).entries as Array<Record<string, unknown>>;
  }
  return [];
}

export async function runPublishGate(projectId: string): Promise<PublishGateResult> {
  const docs = await db
    .select()
    .from(schema.moduleDocuments)
    .where(eq(schema.moduleDocuments.projectId, projectId));

  const docMap = new Map(docs.map((doc) => [doc.module, doc]));
  const missingModules = REQUIRED_MODULES.filter((mod) => !docMap.has(mod));
  const needsReviewModules = docs
    .filter((doc) => doc.needsReview === 1)
    .map((doc) => doc.module);

  const [latestSnapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(eq(schema.truthSnapshots.projectId, projectId))
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  if (!latestSnapshot) {
    return {
      ok: false,
      truthSnapshotId: null,
      missingModules,
      needsReviewModules,
      p0IssueCount: 0,
      p0Issues: []
    };
  }

  const roleEntries = collectEntries(docs, "roles");
  const clueEntries = collectEntries(docs, "clues");
  const timelineEntries = collectEntries(docs, "timeline");

  const newIssues: Array<{
    id: string;
    projectId: string;
    truthSnapshotId: string;
    source: string;
    type: string;
    severity: string;
    title: string;
    description?: string | null;
    refs?: unknown;
  }> = [];

  roleEntries.forEach((entry) => {
    const meta = (entry.meta as Record<string, unknown>) || {};
    const motivation = typeof meta.motivation === "string" ? meta.motivation.trim() : "";
    if (!motivation) {
      newIssues.push({
        id: crypto.randomUUID(),
        projectId,
        truthSnapshotId: latestSnapshot.id,
        source: ISSUE_SOURCE,
        type: "ROLE_MOTIVE_EMPTY",
        severity: "P1",
        title: "角色动机为空",
        description: `角色「${String(entry.name || "未命名")}」未填写动机。`,
        refs: [{ type: "role", id: entry.id, label: entry.name }]
      });
    }
  });

  clueEntries.forEach((entry) => {
    const meta = (entry.meta as Record<string, unknown>) || {};
    const refRoles = typeof meta.refRoleIds === "string" ? meta.refRoleIds.trim() : "";
    const time = typeof meta.time === "string" ? meta.time.trim() : "";
    if (!refRoles || !time) {
      newIssues.push({
        id: crypto.randomUUID(),
        projectId,
        truthSnapshotId: latestSnapshot.id,
        source: ISSUE_SOURCE,
        type: "CLUE_UNBOUND",
        severity: "P1",
        title: "线索未完成绑定",
        description: `线索「${String(entry.name || "未命名")}」缺少绑定角色或出现时机。`,
        refs: [{ type: "clue", id: entry.id, label: entry.name }]
      });
    }
  });

  const timelineIndex = new Map<string, Set<string>>();
  timelineEntries.forEach((entry) => {
    const meta = (entry.meta as Record<string, unknown>) || {};
    const timePoint = typeof meta.timePoint === "string" ? meta.timePoint.trim() : "";
    const participantsRaw =
      typeof meta.participants === "string" ? meta.participants.trim() : "";
    if (!timePoint || !participantsRaw) return;
    const participants = participantsRaw
      .split(/[、,\\/\\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!participants.length) return;
    const existing = timelineIndex.get(timePoint) || new Set<string>();
    const overlap = participants.find((p) => existing.has(p));
    if (overlap) {
      newIssues.push({
        id: crypto.randomUUID(),
        projectId,
        truthSnapshotId: latestSnapshot.id,
        source: ISSUE_SOURCE,
        type: "TIMELINE_CONFLICT",
        severity: "P0",
        title: "时间线冲突",
        description: `时间点「${timePoint}」出现参与角色冲突：${overlap}`,
        refs: [{ type: "timeline", id: entry.id, label: entry.name }]
      });
    }
    participants.forEach((p) => existing.add(p));
    timelineIndex.set(timePoint, existing);
  });

  await db
    .delete(schema.issues)
    .where(
      and(
        eq(schema.issues.projectId, projectId),
        eq(schema.issues.truthSnapshotId, latestSnapshot.id),
        or(eq(schema.issues.source, ISSUE_SOURCE), isNull(schema.issues.source))
      )
    );

  if (newIssues.length) {
    await db.insert(schema.issues).values(newIssues);
  }

  const issues = await db
    .select()
    .from(schema.issues)
    .where(
      and(
        eq(schema.issues.projectId, projectId),
        eq(schema.issues.truthSnapshotId, latestSnapshot.id)
      )
    );
  const p0Issues = issues
    .filter((issue) => String(issue.severity).toUpperCase() === "P0")
    .map((issue) => ({ id: issue.id, type: issue.type, title: issue.title }));

  const ok = missingModules.length === 0 &&
    needsReviewModules.length === 0 &&
    p0Issues.length === 0;

  return {
    ok,
    truthSnapshotId: latestSnapshot.id,
    missingModules,
    needsReviewModules,
    p0IssueCount: p0Issues.length,
    p0Issues
  };
}
