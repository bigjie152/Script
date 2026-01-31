import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const args = process.argv.slice(2);

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return null;
}

function hasFlag(flag) {
  return args.includes(flag);
}

function findRepoRoot(startDir) {
  let dir = startDir;
  const root = path.parse(dir).root;
  while (dir && dir !== root) {
    if (fs.existsSync(path.join(dir, "d1-schema.sql"))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

const repoRoot = findRepoRoot(process.cwd());
if (!repoRoot) {
  console.error("ERROR: Could not locate repo root containing d1-schema.sql.");
  process.exit(1);
}

function readDbNameFromWrangler() {
  const candidates = [
    path.join(repoRoot, "infra", "cloudflare", "wrangler.toml"),
    path.join(repoRoot, "apps", "web", "wrangler.toml")
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    const match = content.match(/database_name\s*=\s*"([^"]+)"/);
    if (match && match[1]) return match[1];
  }
  return null;
}

const modeFlag = hasFlag("--local")
  ? "--local"
  : hasFlag("--preview")
    ? "--preview"
    : "--remote";

const dbName =
  getArgValue("--db") ||
  process.env.D1_DB_NAME ||
  readDbNameFromWrangler();

if (!dbName) {
  console.error("ERROR: Missing database name. Use --db <name> or set D1_DB_NAME.");
  process.exit(1);
}

const wranglerConfig = getArgValue("--config");
const wranglerBin = "wrangler";

function runWrangler(commandArgs) {
  const argsWithConfig = wranglerConfig
    ? ["--config", wranglerConfig, ...commandArgs]
    : commandArgs;
  const result = spawnSync(wranglerBin, argsWithConfig, {
    encoding: "utf8",
    cwd: repoRoot,
    shell: process.platform === "win32"
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const message = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(message.trim() || "wrangler failed");
  }
  return result.stdout.trim();
}

function execSqlFile(sql) {
  const cleanSql = sql.replace(/\s+/g, " ").trim();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "d1-migrate-"));
  const tmpFile = path.join(tmpDir, "stmt.sql");
  fs.writeFileSync(tmpFile, cleanSql + ";\n", "utf8");
  const output = runWrangler([
    "d1",
    "execute",
    dbName,
    modeFlag,
    "--json",
    "--file",
    tmpFile
  ]);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (!output) return [];
  const jsonStart = output.indexOf("[");
  if (jsonStart === -1) return [];
  return JSON.parse(output.slice(jsonStart));
}

function execSqlCommand(sql) {
  const cleanSql = sql.replace(/\s+/g, " ").trim();
  const commandValue =
    process.platform === "win32"
      ? `"${cleanSql.replace(/\"/g, '\\"')}"`
      : cleanSql;
  const output = runWrangler([
    "d1",
    "execute",
    dbName,
    modeFlag,
    "--json",
    "--command",
    commandValue
  ]);
  if (!output) return [];
  return JSON.parse(output);
}

function extractColumns(results) {
  const rows = Array.isArray(results) && results[0] ? results[0].results : [];
  const set = new Set();
  for (const row of rows || []) {
    if (row && typeof row.name === "string") {
      set.add(row.name);
    }
  }
  return set;
}

function parseSchemaStatements(sqlText) {
  return sqlText
    .split(";")
    .map((stmt) => stmt.trim())
    .filter(Boolean);
}

const schemaPath = path.join(repoRoot, "d1-schema.sql");
const schemaText = fs.readFileSync(schemaPath, "utf8");
const statements = parseSchemaStatements(schemaText);
const createStatements = statements.filter((stmt) => {
  const lower = stmt.toLowerCase();
  return lower.startsWith("create table") || lower.startsWith("create index");
});

console.log(`DB=${dbName}`);
console.log(`MODE=${modeFlag.replace("--", "")}`);
console.log("Applying create table/index statements...");
for (const stmt of createStatements) {
  execSqlFile(stmt);
}

const columnsToEnsure = {
  projects: [
    { name: "status", sql: "TEXT" },
    { name: "meta", sql: "TEXT" },
    { name: "cover", sql: "TEXT" },
    { name: "tags", sql: "TEXT" },
    { name: "genre", sql: "TEXT" },
    { name: "players", sql: "TEXT" },
    { name: "duration", sql: "TEXT" },
    { name: "difficulty", sql: "TEXT" },
    { name: "owner_id", sql: "TEXT" },
    { name: "is_public", sql: "INTEGER NOT NULL DEFAULT 0" },
    { name: "published_at", sql: "TEXT" },
    { name: "community_summary", sql: "TEXT" },
    { name: "ai_status", sql: "TEXT" },
    { name: "deleted_at", sql: "TEXT" }
  ],
  module_documents: [
    { name: "needs_review", sql: "INTEGER NOT NULL DEFAULT 0" }
  ]
};

console.log("Checking and adding missing columns...");
for (const [table, columns] of Object.entries(columnsToEnsure)) {
  const pragma = execSqlCommand(`PRAGMA table_info(${table})`);
  const existing = extractColumns(pragma);
  for (const col of columns) {
    if (existing.has(col.name)) continue;
    const alterSql = `ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.sql}`;
    console.log(`- ${table}.${col.name}`);
    try {
      execSqlCommand(alterSql);
    } catch (error) {
      const message = String(error || "");
      if (message.includes("duplicate column name")) {
        continue;
      }
      throw error;
    }
  }
}

console.log("Migration complete.");
