import dotenv from "dotenv";
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

const dbPath = process.env.D1_DB_PATH || "./.d1/local.sqlite";

const statements = [
  `create table if not exists projects (
    id text primary key,
    name text not null,
    description text,
    created_at text not null default CURRENT_TIMESTAMP,
    updated_at text not null default CURRENT_TIMESTAMP
  )`,
  `create table if not exists truths (
    id text primary key,
    project_id text not null,
    status text not null,
    content text not null,
    created_at text not null default CURRENT_TIMESTAMP,
    updated_at text not null default CURRENT_TIMESTAMP
  )`,
  `create table if not exists truth_snapshots (
    id text primary key,
    project_id text not null,
    truth_id text not null,
    version integer not null,
    content text not null,
    created_at text not null default CURRENT_TIMESTAMP
  )`,
  `create table if not exists roles (
    id text primary key,
    project_id text not null,
    truth_snapshot_id text not null,
    name text not null,
    summary text,
    meta text,
    created_at text not null default CURRENT_TIMESTAMP
  )`,
  `create table if not exists issues (
    id text primary key,
    project_id text not null,
    truth_snapshot_id text not null,
    type text not null,
    severity text not null,
    title text not null,
    description text,
    refs text,
    created_at text not null default CURRENT_TIMESTAMP
  )`,
  `create table if not exists ai_request_logs (
    id text primary key,
    project_id text not null,
    truth_snapshot_id text,
    action_type text not null,
    provider text not null,
    model text,
    meta text,
    created_at text not null default CURRENT_TIMESTAMP
  )`,
  `create table if not exists feedback (
    id text primary key,
    project_id text not null,
    content text not null,
    type text,
    meta text,
    created_at text not null default CURRENT_TIMESTAMP
  )`
];

async function main() {
  const resolvedPath = path.resolve(process.cwd(), "..", "..", dbPath);
  mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const database = new Database(resolvedPath);
  for (const statement of statements) {
    database.prepare(statement).run();
  }
  console.log("Database migration complete.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
