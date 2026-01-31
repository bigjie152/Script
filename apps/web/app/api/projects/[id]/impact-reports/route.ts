import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "GET /api/projects/:id/impact-reports";

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

  const reports = await db
    .select()
    .from(schema.impactReports)
    .where(eq(schema.impactReports.projectId, projectId))
    .orderBy(desc(schema.impactReports.createdAt))
    .limit(50);

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      reports: reports.map((report) => ({
        id: report.id,
        truthSnapshotId: report.truthSnapshotId ?? null,
        affectedItems: report.affectedItems,
        createdAt: report.createdAt
      }))
    },
    { requestId }
  );
}
