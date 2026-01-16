import { NextResponse } from "next/server";
import { db, schema } from "../../lib/db";
import { jsonError } from "../../lib/http";

export const runtime = "edge";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const content = body?.content ?? { type: "doc", content: [] };

  if (!name) {
    return jsonError(400, "name is required");
  }

  const projectId = crypto.randomUUID();
  const truthId = crypto.randomUUID();

  await db.insert(schema.projects).values({
    id: projectId,
    name,
    description
  });

  await db.insert(schema.truths).values({
    id: truthId,
    projectId,
    status: "DRAFT",
    content
  });

  return NextResponse.json({
    projectId,
    truthId,
    status: "DRAFT"
  });
}

