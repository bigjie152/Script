import { and, desc, eq, like, or } from "drizzle-orm";
import { db, getD1Binding, schema } from "../../../lib/db";
import { jsonError, jsonResponse } from "../../../lib/http";
import { getAuthUser } from "../../../lib/auth";

export const runtime = "edge";

type ParsedJsonBody =
  | { ok: true; body: Record<string, unknown>; raw: string }
  | { ok: false; message: string; raw?: string };

async function parseJsonBody(request: Request): Promise<ParsedJsonBody> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, message: "unsupported content-type" };
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {}

  const trimmed = raw.replace(/^\uFEFF/, "").trim();
  if (trimmed) {
    try {
      const body = JSON.parse(trimmed);
      if (body && typeof body === "object" && !Array.isArray(body)) {
        return { ok: true, body: body as Record<string, unknown>, raw };
      }
    } catch {}
  }

  if (raw.includes("\u0000")) {
    const compact = raw.replace(/\u0000/g, "").replace(/^\uFEFF/, "").trim();
    if (compact) {
      try {
        const body = JSON.parse(compact);
        if (body && typeof body === "object" && !Array.isArray(body)) {
          return { ok: true, body: body as Record<string, unknown>, raw };
        }
      } catch {}
    }
  }

  return { ok: false, message: "invalid json", raw };
}

const createLabel = "POST /api/projects";
const listLabel = "GET /api/projects";

function logError(context: {
  message: string;
  requestId: string;
  status: number;
  contentType: string;
  startedAt: number;
  body?: unknown;
  error?: unknown;
}) {
  console.error(createLabel, {
    route: createLabel,
    ...context,
    latencyMs: Date.now() - context.startedAt,
    error:
      context.error instanceof Error
        ? { message: context.error.message, stack: context.error.stack }
        : context.error
  });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const contentType = request.headers.get("content-type") || "";

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    logError({
      message: parsed.message,
      requestId,
      status: 400,
      contentType,
      startedAt,
      body: parsed.raw
        ? {
            rawPreview: parsed.raw.slice(0, 200),
            rawLength: parsed.raw.length,
            contentLength: request.headers.get("content-length") || ""
          }
        : { contentLength: request.headers.get("content-length") || "" }
    });
    return jsonError(400, parsed.message, undefined, requestId);
  }

  const body = parsed.body;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const content = body?.content ?? { type: "doc", content: [] };

  if (!name) {
    logError({
      message: "name is required",
      requestId,
      status: 400,
      contentType,
      startedAt,
      body
    });
    return jsonError(400, "name is required", undefined, requestId);
  }

  const bindingName = process.env.D1_BINDING || "DB";
  const binding = getD1Binding();
  if (!binding) {
    logError({
      message: "DB binding not found",
      requestId,
      status: 500,
      contentType,
      startedAt,
      body: { bindingName }
    });
    return jsonError(500, "DB binding not found", undefined, requestId);
  }

  try {
    const user = await getAuthUser(request);
    if (!user) {
      logError({
        message: "login required",
        requestId,
        status: 401,
        contentType,
        startedAt,
        body
      });
      return jsonError(401, "login required", undefined, requestId);
    }

    const projectId = crypto.randomUUID();
    const truthId = crypto.randomUUID();

    await db.insert(schema.projects).values({
      id: projectId,
      name,
      description,
      ownerId: user.id
    });

    await db.insert(schema.truths).values({
      id: truthId,
      projectId,
      status: "DRAFT",
      content
    });

    console.log(createLabel, {
      route: createLabel,
      requestId,
      status: 201,
      latencyMs: Date.now() - startedAt
    });
    return jsonResponse(
      {
        project: { id: projectId, name, description },
        truth: { id: truthId, status: "DRAFT" },
        projectId,
        truthId,
        status: "DRAFT"
      },
      { status: 201, requestId }
    );
  } catch (error) {
    logError({
      message: "failed to create project",
      requestId,
      status: 500,
      contentType,
      startedAt,
      body,
      error
    });
    return jsonError(500, "failed to create project", undefined, requestId);
  }
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const url = new URL(request.url);
  const scope = (url.searchParams.get("scope") || "mine").trim();
  const sort = (url.searchParams.get("sort") || "updatedAt").trim();
  const q = (url.searchParams.get("q") || "").trim();

  const user = await getAuthUser(request);
  if (!user) {
    return jsonError(401, "login required", undefined, requestId);
  }

  if (scope !== "mine") {
    return jsonError(400, "unsupported scope", undefined, requestId);
  }

  const filters = [eq(schema.projects.ownerId, user.id)];
  if (q) {
    const keyword = `%${q}%`;
    const searchCondition = or(
      like(schema.projects.name, keyword),
      like(schema.projects.description, keyword)
    );
    if (searchCondition) {
      filters.push(searchCondition);
    }
  }

  const orderBy = sort === "updatedAt" ? desc(schema.projects.updatedAt) : desc(schema.projects.updatedAt);
  const projects = await db
    .select()
    .from(schema.projects)
    .where(and(...filters))
    .orderBy(orderBy)
    .limit(200);

  const truthStatuses = await Promise.all(
    projects.map(async (project) => {
      const [truth] = await db
        .select()
        .from(schema.truths)
        .where(eq(schema.truths.projectId, project.id))
        .orderBy(desc(schema.truths.createdAt))
        .limit(1);
      return {
        projectId: project.id,
        truthStatus: truth?.status === "LOCKED" ? "Locked" : "Draft"
      };
    })
  );

  const statusMap = new Map(
    truthStatuses.map((item) => [item.projectId, item.truthStatus])
  );

  console.log(listLabel, {
    route: listLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description ?? "",
        updatedAt: project.updatedAt,
        status: "Draft",
        truthStatus: statusMap.get(project.id) ?? "Draft"
      }))
    },
    { requestId }
  );
}
