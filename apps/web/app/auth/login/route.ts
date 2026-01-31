import { eq } from "drizzle-orm";
import { db, schema } from "../../../lib/db";
import { jsonError, jsonResponse } from "../../../lib/http";
import {
  applySessionCookie,
  createSession,
  verifyPassword
} from "../../../lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/auth/login";

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

  if (!username || !password) {
    return jsonError(400, "username or password is required", undefined, requestId);
  }

  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (!user) {
      return jsonError(401, "invalid credentials", undefined, requestId);
    }

    const verified = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!verified) {
      return jsonError(401, "invalid credentials", undefined, requestId);
    }

    const session = await createSession(user.id);

    const response = jsonResponse(
      {
        user: { id: user.id, username: user.username }
      },
      { requestId }
    );

    applySessionCookie(response, session.token, session.expiresAt);

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return response;
  } catch (err) {
    console.error(routeLabel, {
      requestId,
      status: 500,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err)
    });
    return jsonError(
      500,
      "login failed",
      { message: err instanceof Error ? err.message : String(err) },
      requestId
    );
  }
}
