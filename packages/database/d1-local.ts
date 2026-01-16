import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";

type D1Result = {
  results?: unknown[];
  success: boolean;
  meta?: Record<string, unknown>;
};

type D1PreparedStatement = {
  bind: (...params: unknown[]) => D1PreparedStatement;
  run: () => Promise<D1Result>;
  all: () => Promise<D1Result>;
  first: () => Promise<unknown>;
  raw: () => Promise<unknown[][]>;
};

export type D1DatabaseLike = {
  prepare: (sql: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<D1Result[]>;
  exec: (sql: string) => Promise<D1Result>;
};

class LocalPreparedStatement implements D1PreparedStatement {
  private params: unknown[] = [];

  constructor(private statement: Database.Statement) {}

  bind(...params: unknown[]) {
    const bound = new LocalPreparedStatement(this.statement);
    bound.params = params;
    return bound;
  }

  async run() {
    const info = this.statement.run(this.params);
    return {
      success: true,
      meta: {
        changes: info.changes,
        lastInsertRowid: info.lastInsertRowid
      }
    };
  }

  async all() {
    const rows = this.statement.all(this.params);
    return {
      success: true,
      results: rows,
      meta: {
        rowsRead: rows.length
      }
    };
  }

  async first() {
    const row = this.statement.get(this.params);
    return row ?? null;
  }

  async raw() {
    const rows = this.statement.raw(true).all(this.params) as unknown[][];
    return rows;
  }
}

class LocalD1Database implements D1DatabaseLike {
  constructor(private database: Database.Database) {}

  prepare(sql: string) {
    return new LocalPreparedStatement(this.database.prepare(sql));
  }

  async batch(statements: D1PreparedStatement[]) {
    const results: D1Result[] = [];
    for (const statement of statements) {
      results.push(await statement.run());
    }
    return results;
  }

  async exec(sql: string) {
    this.database.exec(sql);
    return { success: true };
  }
}

export function createLocalD1Database(dbPath: string) {
  const resolvedPath = path.resolve(process.cwd(), "..", "..", dbPath);
  mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const database = new Database(resolvedPath);
  return new LocalD1Database(database);
}

export default createLocalD1Database;
