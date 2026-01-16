import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const truths = sqliteTable("truths", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  status: text("status").notNull(),
  content: text("content", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
