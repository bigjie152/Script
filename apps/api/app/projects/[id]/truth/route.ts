import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, schema } from "../../../../lib/db";
import { jsonError } from "../../../../lib/http";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: projectId } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));
  const content = body?.content;

  if (!content) {
    return jsonError(400, "content is required");
  }

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    return jsonError(404, "project not found");
  }

  const [truth] = await db
    .select()
    .from(schema.truths)
    .where(eq(schema.truths.projectId, projectId))
    .orderBy(desc(schema.truths.createdAt))
    .limit(1);

  if (truth && truth.status === "LOCKED") {
    return jsonError(409, "truth is locked");
  }

  if (truth) {
    await db
      .update(schema.truths)
      .set({ content, updatedAt: new Date().toISOString() })
      .where(eq(schema.truths.id, truth.id));

    return NextResponse.json({
      truthId: truth.id,
      status: "DRAFT"
    });
  }

  const truthId = randomUUID();
  await db.insert(schema.truths).values({
    id: truthId,
    projectId,
    status: "DRAFT",
    content
  });

  return NextResponse.json({
    truthId,
    status: "DRAFT"
  });
}
