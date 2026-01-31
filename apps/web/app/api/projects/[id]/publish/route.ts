import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";
import { getCommunitySummary } from "@/app/api/community/utils";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/publish";
const REQUIRED_MODULES = ["story", "roles", "clues", "timeline", "dm"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return jsonError(401, "请先登录", undefined, requestId);
    }

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!project) {
      return jsonError(404, "项目不存在", undefined, requestId);
    }

    if (project.ownerId && project.ownerId !== user.id) {
      return jsonError(403, "无权限访问", undefined, requestId);
    }

    if (project.status === "ARCHIVED") {
      return jsonError(409, "项目已归档，无法发布", undefined, requestId);
    }

    const [truth] = await db
      .select()
      .from(schema.truths)
      .where(eq(schema.truths.projectId, projectId))
      .limit(1);

    if (!truth || truth.status !== "LOCKED") {
      return jsonError(409, "真相未锁定，无法发布", undefined, requestId);
    }

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
      return jsonError(409, "未找到 Truth 快照，无法发布", undefined, requestId);
    }

    const collectionFor = (moduleKey: string) => {
      const doc = docMap.get(moduleKey);
      const content = doc?.content as Record<string, unknown> | undefined;
      if (content && content.kind === "collection" && Array.isArray((content as any).entries)) {
        return (content as any).entries as Array<Record<string, unknown>>;
      }
      return [];
    };

    const roleEntries = collectionFor("roles");
    const clueEntries = collectionFor("clues");
    const timelineEntries = collectionFor("timeline");

    const newIssues: Array<{
      id: string;
      projectId: string;
      truthSnapshotId: string;
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
          eq(schema.issues.type, "ROLE_MOTIVE_EMPTY")
        )
      );
    await db
      .delete(schema.issues)
      .where(
        and(
          eq(schema.issues.projectId, projectId),
          eq(schema.issues.truthSnapshotId, latestSnapshot.id),
          eq(schema.issues.type, "CLUE_UNBOUND")
        )
      );
    await db
      .delete(schema.issues)
      .where(
        and(
          eq(schema.issues.projectId, projectId),
          eq(schema.issues.truthSnapshotId, latestSnapshot.id),
          eq(schema.issues.type, "TIMELINE_CONFLICT")
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
    const p0Issues = issues.filter(
      (issue) => String(issue.severity).toUpperCase() === "P0"
    );

    if (missingModules.length || needsReviewModules.length || p0Issues.length) {
      return jsonError(
        409,
        "发布前校验未通过，请先修复结构或致命问题",
        {
          missingModules,
          needsReviewModules,
          p0IssueCount: p0Issues.length,
          p0Issues: p0Issues.map((issue) => ({
            id: issue.id,
            type: issue.type,
            title: issue.title
          }))
        },
        requestId
      );
    }

    const summary = await getCommunitySummary(projectId);
    const now = new Date().toISOString();

    await db
      .update(schema.projects)
      .set({
        isPublic: 1,
        publishedAt: now,
        communitySummary: summary ?? project.communitySummary,
        status: "PUBLISHED",
        updatedAt: now
      })
      .where(eq(schema.projects.id, projectId));

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ published: true, publishedAt: now }, { requestId });
  } catch (error) {
    console.error(routeLabel, {
      route: routeLabel,
      requestId,
      status: 500,
      latencyMs: Date.now() - startedAt,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error
    });
    return jsonError(500, "发布失败，请稍后再试", undefined, requestId);
  }
}


