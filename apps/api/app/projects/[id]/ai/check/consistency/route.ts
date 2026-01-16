import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, schema } from "../../../../../../lib/db";
import { jsonError } from "../../../../../../lib/http";
import { consistencyCheck } from "../../../../../../lib/ai";
import { loadPrompt } from "../../../../../../lib/prompts";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));
  const requestedSnapshotId =
    typeof body?.truthSnapshotId === "string" ? body.truthSnapshotId : null;

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    return jsonError(404, "project not found");
  }

  const [snapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(
      requestedSnapshotId
        ? and(
            eq(schema.truthSnapshots.id, requestedSnapshotId),
            eq(schema.truthSnapshots.projectId, projectId)
          )
        : eq(schema.truthSnapshots.projectId, projectId)
    )
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  if (!snapshot) {
    return jsonError(404, "truth snapshot not found");
  }

  type RoleRow = typeof schema.roles.$inferSelect;
  const storedRoles = (await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.truthSnapshotId, snapshot.id))) as RoleRow[];

  const roles = storedRoles.map((role: RoleRow) => ({
    name: role.name,
    summary: role.summary ?? undefined,
    meta: role.meta ?? undefined
  }));

  const prompt = await loadPrompt("check/consistency.v1.md");
  const result = await consistencyCheck({
    prompt,
    project,
    truthSnapshot: snapshot,
    roles
  });

  await db
    .delete(schema.issues)
    .where(eq(schema.issues.truthSnapshotId, snapshot.id));

  if (result.issues.length > 0) {
    await db.insert(schema.issues).values(
      result.issues.map((issue) => ({
        id: randomUUID(),
        projectId,
        truthSnapshotId: snapshot.id,
        type: issue.type,
        severity: issue.severity,
        title: issue.title,
        description: issue.description ?? null,
        refs: issue.refs ?? null
      }))
    );
  }

  await db.insert(schema.aiRequestLogs).values({
    id: randomUUID(),
    projectId,
    truthSnapshotId: snapshot.id,
    actionType: "consistency_check",
    provider: result.provider,
    model: result.model,
    meta: { prompt: "check/consistency.v1.md" }
  });

  return NextResponse.json({
    truthSnapshotId: snapshot.id,
    issues: result.issues
  });
}
