import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../index";
import { createDb } from "../db/index";
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  attachTagToTodo,
  detachTagFromTodo,
} from "../db/queries";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const priorityEnum = z.enum(["low", "medium", "high"]);

const createTodoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  priority: priorityEnum.optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  tag_ids: z.array(z.string()).optional(),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  completed: z.boolean().optional(),
  priority: priorityEnum.optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  tag_ids: z.array(z.string()).optional(),
});

const listQuerySchema = z.object({
  completed: z
    .string()
    .optional()
    .transform((v) => {
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    }),
  priority: priorityEnum.optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().max(100).optional()),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const todosRouter = new Hono<{ Bindings: Env }>();

// GET /api/todos — list todos with optional filters and pagination
todosRouter.get("/", zValidator("query", listQuerySchema), async (c) => {
  const filters = c.req.valid("query");
  const db = createDb(c.env.DB);

  const { todos, total, page, limit } = await getTodos(db, {
    completed: filters.completed,
    priority: filters.priority,
    tag: filters.tag,
    search: filters.search,
    page: filters.page,
    limit: filters.limit,
  });

  const totalPages = Math.ceil(total / limit);

  return c.json({
    data: todos,
    meta: { total, page, limit, totalPages },
    error: null,
  });
});

// POST /api/todos — create a todo
todosRouter.post("/", zValidator("json", createTodoSchema), async (c) => {
  const input = c.req.valid("json");
  const db = createDb(c.env.DB);
  const todo = await createTodo(db, input);
  return c.json({ data: todo, error: null }, 201);
});

// GET /api/todos/:id — get single todo with tags
todosRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);
  const todo = await getTodoById(db, id);

  if (!todo) {
    return c.json({ data: null, error: "Todo not found." }, 404);
  }

  return c.json({ data: todo, error: null });
});

// PUT /api/todos/:id — full update
todosRouter.put("/:id", zValidator("json", updateTodoSchema), async (c) => {
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const db = createDb(c.env.DB);

  const todo = await updateTodo(db, id, input);
  if (!todo) {
    return c.json({ data: null, error: "Todo not found." }, 404);
  }

  return c.json({ data: todo, error: null });
});

// DELETE /api/todos/:id — delete a todo
todosRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const deleted = await deleteTodo(db, id);
  if (!deleted) {
    return c.json({ data: null, error: "Todo not found." }, 404);
  }

  return new Response(null, { status: 204 });
});

// PATCH /api/todos/:id/toggle — toggle completed status
todosRouter.patch("/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const todo = await toggleTodo(db, id);
  if (!todo) {
    return c.json({ data: null, error: "Todo not found." }, 404);
  }

  return c.json({ data: todo, error: null });
});

// POST /api/todos/:id/tags/:tagId — attach tag to todo
todosRouter.post("/:id/tags/:tagId", async (c) => {
  const id = c.req.param("id");
  const tagId = c.req.param("tagId");
  const db = createDb(c.env.DB);

  const todo = await attachTagToTodo(db, id, tagId);
  if (!todo) {
    return c.json({ data: null, error: "Todo or tag not found." }, 404);
  }

  return c.json({ data: todo, error: null });
});

// DELETE /api/todos/:id/tags/:tagId — detach tag from todo
todosRouter.delete("/:id/tags/:tagId", async (c) => {
  const id = c.req.param("id");
  const tagId = c.req.param("tagId");
  const db = createDb(c.env.DB);

  const todo = await detachTagFromTodo(db, id, tagId);
  if (!todo) {
    return c.json({ data: null, error: "Todo not found." }, 404);
  }

  return c.json({ data: todo, error: null });
});
