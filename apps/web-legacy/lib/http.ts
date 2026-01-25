import { NextResponse } from "next/server";

type JsonOptions = {
  status?: number;
  requestId?: string;
};

export function jsonResponse<T extends Record<string, unknown>>(
  data: T,
  options: JsonOptions = {}
) {
  const headers = new Headers();
  if (options.requestId) {
    headers.set("x-request-id", options.requestId);
  }
  const payload = options.requestId ? { ...data, requestId: options.requestId } : data;
  return NextResponse.json(payload, {
    status: options.status ?? 200,
    headers
  });
}

export function jsonError(
  status: number,
  message: string,
  details?: unknown,
  requestId?: string
) {
  return jsonResponse(
    { error: { message, details } },
    { status, requestId }
  );
}
