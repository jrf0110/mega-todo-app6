import { Hono } from "hono";
import { logger } from "hono/logger";
import { corsMiddleware } from "./middleware/cors";
import { errorMiddleware } from "./middleware/error";
import { todosRouter } from "./routes/todos";
import { tagsRouter } from "./routes/tags";

export type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use("*", logger());
app.use("*", corsMiddleware);
app.use("*", errorMiddleware);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.route("/api/todos", todosRouter);
app.route("/api/tags", tagsRouter);

// Health check
app.get("/api/health", (c) => {
  return c.json({ data: { status: "ok", timestamp: new Date().toISOString() }, error: null });
});

// ---------------------------------------------------------------------------
// Fallback handlers
// ---------------------------------------------------------------------------

app.notFound((c) => {
  return c.json({ data: null, error: "Not found." }, 404);
});

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ data: null, error: "Internal server error." }, 500);
});

export default app;
