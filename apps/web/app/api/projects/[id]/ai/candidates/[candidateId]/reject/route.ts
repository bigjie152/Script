import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/ai/candidates/:candidateId/reject";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId, candidateId } = await Promise.resolve(params);

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

  const [candidate] = await db
    .select()
    .from(schema.aiCandidates)
    .where(
      and(
        eq(schema.aiCandidates.id, candidateId),
        eq(schema.aiCandidates.projectId, projectId)
      )
    )
    .limit(1);

  if (!candidate) {
    return jsonError(404, "候选内容不存在", undefined, requestId);
  }

  if (candidate.status !== "pending") {
    return jsonResponse({ status: candidate.status }, { requestId });
  }

  const now = new Date().toISOString();
  await db
    .update(schema.aiCandidates)
    .set({ status: "rejected", updatedAt: now })
    .where(eq(schema.aiCandidates.id, candidateId));

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      status: "rejected"
    },
    { requestId }
  );
}
