import { jsonResponse } from "../../../lib/http";
import { getAuthUser } from "../../../lib/auth";

export const runtime = "edge";

const routeLabel = "GET /api/auth/me";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const user = await getAuthUser(request);

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      user: user ? { id: user.id, username: user.username } : null
    },
    { requestId }
  );
}
