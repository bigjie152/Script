import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import createLocalD1Database from "./d1-local";

const dbPath = process.env.D1_DB_PATH || "./.d1/local.sqlite";
const bindingName = process.env.D1_BINDING || "DB";
const binding = (globalThis as Record<string, unknown>)[bindingName];

const candidate = createLocalD1Database as unknown as {
  default?: (path: string) => unknown;
  createLocalD1Database?: (path: string) => unknown;
};
const fn =
  typeof candidate === "function"
    ? (candidate as unknown as (path: string) => unknown)
    : candidate.default || candidate.createLocalD1Database;
if (typeof fn !== "function") {
  throw new Error("createLocalD1Database is not available");
}

const d1 =
  binding && typeof (binding as { prepare?: unknown }).prepare === "function"
    ? binding
    : fn(dbPath);

export const db = drizzle(d1, { schema });
