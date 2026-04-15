import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, "")),
  title: text("title").notNull(),
  description: text("description"),
  completed: integer("completed").notNull().default(0),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  due_date: text("due_date"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tags = sqliteTable("tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, "")),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6366f1"),
});

export const todo_tags = sqliteTable(
  "todo_tags",
  {
    todo_id: text("todo_id")
      .notNull()
      .references(() => todos.id, { onDelete: "cascade" }),
    tag_id: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.todo_id, table.tag_id] }),
  })
);

export type TodoRow = typeof todos.$inferSelect;
export type NewTodoRow = typeof todos.$inferInsert;
export type TagRow = typeof tags.$inferSelect;
export type NewTagRow = typeof tags.$inferInsert;
export type TodoTagRow = typeof todo_tags.$inferSelect;
