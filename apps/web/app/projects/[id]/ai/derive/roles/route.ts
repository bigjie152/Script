import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../../../../../../lib/db";
import { jsonError } from "../../../../../../lib/http";
import { deriveRoles } from "../../../../../../lib/ai";
import { loadPrompt } from "../../../../../../lib/prompts";

export const runtime = "edge";

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

  const prompt = await loadPrompt("derive/role.v1.md");
  const result = await deriveRoles({
    prompt,
    project,
    truthSnapshot: snapshot
  });

  await db
    .delete(schema.roles)
    .where(eq(schema.roles.truthSnapshotId, snapshot.id));

  if (result.roles.length > 0) {
    await db.insert(schema.roles).values(
      result.roles.map((role) => ({
        id: crypto.randomUUID(),
        projectId,
        truthSnapshotId: snapshot.id,
        name: role.name,
        summary: role.summary ?? null,
        meta: role.meta ?? null
      }))
    );
  }

  await db.insert(schema.aiRequestLogs).values({
    id: crypto.randomUUID(),
    projectId,
    truthSnapshotId: snapshot.id,
    actionType: "derive_roles",
    provider: result.provider,
    model: result.model,
    meta: { prompt: "derive/role.v1.md" }
  });

  return NextResponse.json({
    truthSnapshotId: snapshot.id,
    roles: result.roles
  });
}
