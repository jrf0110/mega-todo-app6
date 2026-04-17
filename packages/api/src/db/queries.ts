import { eq, and, like, sql, inArray } from "drizzle-orm";
import type { Database } from "./index";
import { todos, tags, todo_tags } from "./schema";
import type { TodoFilters } from "../types";

// ---------------------------------------------------------------------------
// Todo queries
// ---------------------------------------------------------------------------

export async function getTodos(db: Database, filters: TodoFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [];

  if (filters.completed !== undefined) {
    conditions.push(eq(todos.completed, filters.completed ? 1 : 0));
  }

  if (filters.priority) {
    conditions.push(eq(todos.priority, filters.priority));
  }

  if (filters.search) {
    conditions.push(like(todos.title, `%${filters.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let todoRows;
  let totalRows;

  if (filters.tag) {
    // Filter by tag name requires a subquery via todo_tags join
    const tagRow = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, filters.tag))
      .get();

    if (!tagRow) {
      return { todos: [], total: 0, page, limit };
    }

    const tagCondition = eq(todo_tags.tag_id, tagRow.id);

    const taggedTodoIds = await db
      .select({ todo_id: todo_tags.todo_id })
      .from(todo_tags)
      .where(tagCondition)
      .all();

    const ids = taggedTodoIds.map((r) => r.todo_id);
    if (ids.length === 0) {
      return { todos: [], total: 0, page, limit };
    }

    const tagFilter = inArray(todos.id, ids);
    const combinedWhere = where ? and(where, tagFilter) : tagFilter;

    [todoRows, totalRows] = await Promise.all([
      db
        .select()
        .from(todos)
        .where(combinedWhere)
        .limit(limit)
        .offset(offset)
        .all(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(todos)
        .where(combinedWhere)
        .get(),
    ]);
  } else {
    [todoRows, totalRows] = await Promise.all([
      db.select().from(todos).where(where).limit(limit).offset(offset).all(),
      db
        .select({ count: sql<number>`count(*)` })
        .from(todos)
        .where(where)
        .get(),
    ]);
  }

  // Fetch tags for each todo
  const todoIds = todoRows.map((t) => t.id);
  let todoTagMap: Record<string, Array<{ id: string; name: string; color: string }>> = {};

  if (todoIds.length > 0) {
    const tagRows = await db
      .select({
        todo_id: todo_tags.todo_id,
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(todo_tags)
      .innerJoin(tags, eq(todo_tags.tag_id, tags.id))
      .where(inArray(todo_tags.todo_id, todoIds))
      .all();

    for (const row of tagRows) {
      if (!todoTagMap[row.todo_id]) {
        todoTagMap[row.todo_id] = [];
      }
      todoTagMap[row.todo_id].push({ id: row.id, name: row.name, color: row.color });
    }
  }

  const result = todoRows.map((todo) => ({
    ...todo,
    tags: todoTagMap[todo.id] ?? [],
  }));

  return {
    todos: result,
    total: totalRows?.count ?? 0,
    page,
    limit,
  };
}

export async function getTodoById(db: Database, id: string) {
  const todo = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!todo) return null;

  const tagRows = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(todo_tags)
    .innerJoin(tags, eq(todo_tags.tag_id, tags.id))
    .where(eq(todo_tags.todo_id, id))
    .all();

  return { ...todo, tags: tagRows };
}

export async function createTodo(
  db: Database,
  input: {
    title: string;
    description?: string | null;
    priority?: "low" | "medium" | "high";
    due_date?: string | null;
    tag_ids?: string[];
  }
) {
  const id = crypto.randomUUID().replace(/-/g, "");
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  await db.insert(todos).values({
    id,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? "medium",
    due_date: input.due_date ?? null,
    created_at: now,
    updated_at: now,
  });

  if (input.tag_ids && input.tag_ids.length > 0) {
    await db.insert(todo_tags).values(
      input.tag_ids.map((tag_id) => ({ todo_id: id, tag_id }))
    );
  }

  return getTodoById(db, id);
}

export async function updateTodo(
  db: Database,
  id: string,
  input: {
    title?: string;
    description?: string | null;
    completed?: boolean;
    priority?: "low" | "medium" | "high";
    due_date?: string | null;
    tag_ids?: string[];
  }
) {
  const existing = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!existing) return null;

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  const updateValues: Record<string, unknown> = { updated_at: now };
  if (input.title !== undefined) updateValues.title = input.title;
  if (input.description !== undefined) updateValues.description = input.description;
  if (input.completed !== undefined) updateValues.completed = input.completed ? 1 : 0;
  if (input.priority !== undefined) updateValues.priority = input.priority;
  if (input.due_date !== undefined) updateValues.due_date = input.due_date;

  await db.update(todos).set(updateValues).where(eq(todos.id, id));

  if (input.tag_ids !== undefined) {
    // Replace all existing tag associations
    await db.delete(todo_tags).where(eq(todo_tags.todo_id, id));
    if (input.tag_ids.length > 0) {
      await db.insert(todo_tags).values(
        input.tag_ids.map((tag_id) => ({ todo_id: id, tag_id }))
      );
    }
  }

  return getTodoById(db, id);
}

export async function deleteTodo(db: Database, id: string) {
  const existing = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!existing) return false;

  await db.delete(todos).where(eq(todos.id, id));
  return true;
}

export async function toggleTodo(db: Database, id: string) {
  const existing = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!existing) return null;

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const newCompleted = existing.completed === 0 ? 1 : 0;

  await db
    .update(todos)
    .set({ completed: newCompleted, updated_at: now })
    .where(eq(todos.id, id));

  return getTodoById(db, id);
}

// ---------------------------------------------------------------------------
// Tag queries
// ---------------------------------------------------------------------------

export async function getTags(db: Database) {
  return db.select().from(tags).all();
}

export async function getTagById(db: Database, id: string) {
  return db.select().from(tags).where(eq(tags.id, id)).get() ?? null;
}

export async function createTag(
  db: Database,
  input: { name: string; color?: string }
) {
  const id = crypto.randomUUID().replace(/-/g, "");
  await db.insert(tags).values({
    id,
    name: input.name,
    color: input.color ?? "#6366f1",
  });
  return getTagById(db, id);
}

export async function deleteTag(db: Database, id: string) {
  const existing = await db.select().from(tags).where(eq(tags.id, id)).get();
  if (!existing) return false;
  await db.delete(tags).where(eq(tags.id, id));
  return true;
}

// ---------------------------------------------------------------------------
// Todo-tag association queries
// ---------------------------------------------------------------------------

export async function attachTagToTodo(
  db: Database,
  todoId: string,
  tagId: string
) {
  const todo = await db.select().from(todos).where(eq(todos.id, todoId)).get();
  if (!todo) return null;

  const tag = await db.select().from(tags).where(eq(tags.id, tagId)).get();
  if (!tag) return null;

  // Upsert — ignore if already exists
  const existing = await db
    .select()
    .from(todo_tags)
    .where(and(eq(todo_tags.todo_id, todoId), eq(todo_tags.tag_id, tagId)))
    .get();

  if (!existing) {
    await db.insert(todo_tags).values({ todo_id: todoId, tag_id: tagId });
  }

  return getTodoById(db, todoId);
}

export async function detachTagFromTodo(
  db: Database,
  todoId: string,
  tagId: string
) {
  const todo = await db.select().from(todos).where(eq(todos.id, todoId)).get();
  if (!todo) return null;

  await db
    .delete(todo_tags)
    .where(and(eq(todo_tags.todo_id, todoId), eq(todo_tags.tag_id, tagId)));

  return getTodoById(db, todoId);
}
