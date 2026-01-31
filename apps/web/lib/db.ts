import { drizzle } from "drizzle-orm/d1";
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

  const pickFromEnv = (env: Record<string, unknown> | undefined) => {
    if (!env) return null;
    const binding =
      env[bindingName] ?? (bindingName !== "DB" ? env.DB : undefined);
    if (binding && typeof (binding as D1Binding).prepare === "function") {
      return binding as D1Binding;
    }
    return null;
  };

  const ctx = (globalThis as Record<symbol, unknown>)[
    cloudflareContextSymbol
  ] as { env?: Record<string, unknown> } | undefined;
  const fromSymbol = pickFromEnv(ctx?.env);
  if (fromSymbol) return fromSymbol;

  try {
    for (const sym of Object.getOwnPropertySymbols(globalThis)) {
      const candidate = (globalThis as Record<symbol, unknown>)[sym];
      if (
        candidate &&
        typeof candidate === "object" &&
        "env" in (candidate as Record<string, unknown>)
      ) {
        const env = (candidate as { env?: Record<string, unknown> }).env;
        const resolved = pickFromEnv(env);
        if (resolved) return resolved;
      }
    }
  } catch {
    // ignore symbol probing failures
  }

  try {
    for (const key of Object.getOwnPropertyNames(globalThis)) {
      const lowered = key.toLowerCase();
      if (!lowered.includes("cloudflare") && !lowered.includes("env")) {
        const candidate = (globalThis as Record<string, unknown>)[key];
        if (
          candidate &&
          typeof candidate === "object" &&
          typeof (candidate as D1Binding).prepare === "function"
        ) {
          return candidate as D1Binding;
        }
        continue;
      }
      const candidate = (globalThis as Record<string, unknown>)[key];
      if (
        candidate &&
        typeof candidate === "object" &&
        "env" in (candidate as Record<string, unknown>)
      ) {
        const env = (candidate as { env?: Record<string, unknown> }).env;
        const resolved = pickFromEnv(env);
        if (resolved) return resolved;
      }
      if (key === "env" && candidate && typeof candidate === "object") {
        const resolved = pickFromEnv(candidate as Record<string, unknown>);
        if (resolved) return resolved;
      }
    }
  } catch {
    // ignore name probing failures
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
