import { drizzle } from "drizzle-orm/d1";
import { getRequestContext } from "@cloudflare/next-on-pages";
import * as schema from "./schema";

type D1Binding = {
  prepare: (sql: string) => unknown;
};

const cloudflareContextSymbol = Symbol.for("__cloudflare-request-context__");
let cachedDb: ReturnType<typeof drizzle> | null = null;

function resolveBinding(): D1Binding | null {
  const bindingName = process.env.D1_BINDING || "DB";
  const globalBinding = (globalThis as Record<string, unknown>)[bindingName];
  if (
    globalBinding &&
    typeof (globalBinding as D1Binding).prepare === "function"
  ) {
    return globalBinding as D1Binding;
  }

  let env: Record<string, unknown> | undefined;
  try {
    env = getRequestContext()?.env as Record<string, unknown> | undefined;
  } catch {
    env = undefined;
  }
  if (!env) {
    const ctx = (globalThis as Record<symbol, unknown>)[
      cloudflareContextSymbol
    ] as { env?: Record<string, unknown> } | undefined;
    env = ctx?.env;
  }
  const binding =
    env?.[bindingName] ??
    (bindingName !== "DB" ? env?.DB : undefined);
  if (binding && typeof (binding as D1Binding).prepare === "function") {
    return binding as D1Binding;
  }

  return null;
}

export function getD1Binding(): D1Binding | null {
  return resolveBinding();
}

function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const binding = getD1Binding();
  if (!binding) {
    throw new Error(
      `D1 binding is not available. Run via Wrangler with D1 bound.`
    );
  }

  cachedDb = drizzle(binding, { schema });
  return cachedDb;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb() as unknown as Record<string, unknown>;
    const value = instance[prop as keyof typeof instance];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});

export { schema };
