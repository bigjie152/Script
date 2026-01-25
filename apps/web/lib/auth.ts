import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "./db";

export type AuthUser = {
  id: string;
  username: string;
};

const SESSION_COOKIE = "script_session";
const SESSION_DAYS = 7;
const PBKDF2_ITERATIONS = 100000;

type SessionRecord = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
};

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function parseCookies(cookieHeader: string | null) {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  cookieHeader.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return;
    result[key] = decodeURIComponent(rest.join("="));
  });
  return result;
}

export function getSessionToken(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[SESSION_COOKIE] || null;
}

export async function getAuthUser(
  request: Request
): Promise<AuthUser | null> {
  const token = getSessionToken(request);
  if (!token) return null;

  const nowIso = new Date().toISOString();
  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, nowIso)))
    .limit(1);

  if (!session) {
    return null;
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);

  if (!user) return null;

  return {
    id: user.id,
    username: user.username
  };
}

export async function createSession(userId: string): Promise<SessionRecord> {
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const token = crypto.randomUUID();
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt
  };

  await db.insert(schema.sessions).values({
    id: session.id,
    userId: session.userId,
    token: session.token,
    expiresAt: session.expiresAt
  });

  return session;
}

export async function deleteSession(token: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

export async function hashPassword(password: string, saltHex?: string) {
  const encoder = new TextEncoder();
  const salt = saltHex ? hexToBytes(saltHex) : randomBytes(16);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    key,
    256
  );

  return {
    hash: bytesToHex(new Uint8Array(bits)),
    salt: bytesToHex(salt)
  };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
) {
  const result = await hashPassword(password, salt);
  return result.hash === expectedHash;
}

export function applySessionCookie(
  response: Response,
  token: string,
  expiresAt: string
) {
  const cookie = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    `Expires=${new Date(expiresAt).toUTCString()}`
  ].join("; ");
  response.headers.append("Set-Cookie", cookie);
}

export function clearSessionCookie(response: Response) {
  const cookie = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    "Max-Age=0"
  ].join("; ");
  response.headers.append("Set-Cookie", cookie);
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
