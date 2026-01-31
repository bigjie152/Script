import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "GET /api/projects/:id/structure-status";
const REQUIRED_MODULES = ["story", "roles", "clues", "timeline", "dm"] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);

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

  const docs = await db
    .select()
    .from(schema.moduleDocuments)
    .where(eq(schema.moduleDocuments.projectId, projectId));

  const docMap = new Map(docs.map((doc) => [doc.module, doc]));
  const missingModules = REQUIRED_MODULES.filter((mod) => !docMap.has(mod));
  const ready = missingModules.length === 0;

  const needsReviewModules = docs
    .filter((doc) => doc.needsReview === 1)
    .map((doc) => doc.module);

  const [latestSnapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(eq(schema.truthSnapshots.projectId, projectId))
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  let p0Issues: string[] = [];
  if (latestSnapshot) {
    const issues = await db
      .select()
      .from(schema.issues)
      .where(
        and(
          eq(schema.issues.projectId, projectId),
          eq(schema.issues.truthSnapshotId, latestSnapshot.id)
        )
      );
    p0Issues = issues
      .filter((issue) => String(issue.severity).toUpperCase() === "P0")
      .map((issue) => issue.id);
  }

  const healthy =
    ready && needsReviewModules.length === 0 && p0Issues.length === 0;

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      ready,
      healthy,
      missingModules,
      needsReviewModules,
      p0IssueCount: p0Issues.length
    },
    { requestId }
  );
}
