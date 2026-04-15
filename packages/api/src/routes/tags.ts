import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../index";
import { createDb } from "../db/index";
import { getTags, getTagById, createTag, deleteTag } from "../db/queries";

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color (e.g. #6366f1)")
    .optional(),
});

export const tagsRouter = new Hono<{ Bindings: Env }>();

// GET /api/tags — list all tags
tagsRouter.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const data = await getTags(db);
  return c.json({ data, error: null });
});

// POST /api/tags — create a tag
tagsRouter.post("/", zValidator("json", createTagSchema), async (c) => {
  const input = c.req.valid("json");
  const db = createDb(c.env.DB);
  const tag = await createTag(db, input);
  return c.json({ data: tag, error: null }, 201);
});

// DELETE /api/tags/:id — delete a tag
tagsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const existing = await getTagById(db, id);
  if (!existing) {
    return c.json({ data: null, error: "Tag not found." }, 404);
  }

  await deleteTag(db, id);
  return new Response(null, { status: 204 });
});
