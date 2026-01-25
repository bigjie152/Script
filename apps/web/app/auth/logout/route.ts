import { jsonResponse } from "../../../lib/http";
import { clearSessionCookie, deleteSession, getSessionToken } from "../../../lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/auth/logout";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const token = getSessionToken(request);

  if (token) {
    await deleteSession(token);
  }

  const response = jsonResponse(
    { status: "ok" },
    { requestId }
  );
  clearSessionCookie(response);

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return response;
}
