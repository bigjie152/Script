import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../../packages/database/schema";

type D1Binding = {
  prepare: (sql: string) => unknown;
};

let cachedDb: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const bindingName = process.env.D1_BINDING || "DB";
  const binding = (globalThis as Record<string, unknown>)[bindingName];

  if (!binding || typeof (binding as D1Binding).prepare !== "function") {
    throw new Error(
      `D1 binding "${bindingName}" is not available. Run via Wrangler with D1 bound.`
    );
  }

  cachedDb = drizzle(binding as D1Binding, { schema });
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
