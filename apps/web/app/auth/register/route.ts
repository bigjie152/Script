import { eq } from "drizzle-orm";
import { db, schema } from "../../../lib/db";
import { jsonError, jsonResponse } from "../../../lib/http";
import { applySessionCookie, createSession, hashPassword } from "../../../lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/auth/register";

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

  return { ok: false, message: "invalid json", raw };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const parsed = await parseJsonBody(request);

  if (!parsed.ok) {
    return jsonError(400, parsed.message, undefined, requestId);
  }

  const body = parsed.body;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (username.length < 3) {
    return jsonError(400, "username is required", undefined, requestId);
  }

  if (password.length < 6) {
    return jsonError(400, "password is required", undefined, requestId);
  }

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (existing) {
    return jsonError(409, "username already exists", undefined, requestId);
  }

  const userId = crypto.randomUUID();
  const { hash, salt } = await hashPassword(password);

  await db.insert(schema.users).values({
    id: userId,
    username,
    passwordHash: hash,
    passwordSalt: salt
  });

  const session = await createSession(userId);

  const response = jsonResponse(
    {
      user: { id: userId, username }
    },
    { status: 201, requestId }
  );

  applySessionCookie(response, session.token, session.expiresAt);

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 201,
    latencyMs: Date.now() - startedAt
  });

  return response;
}
