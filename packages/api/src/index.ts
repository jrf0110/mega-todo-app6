import { Hono } from "hono";
import { logger } from "hono/logger";
import { corsMiddleware } from "./middleware/cors";
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

  // D1 errors typically surface as generic Error objects with a message
  if (err instanceof Error) {
    // Unique constraint violations
    if (err.message.includes("UNIQUE constraint failed")) {
      return c.json({ data: null, error: "A record with that value already exists." }, 409);
    }

    // Foreign key constraint violations
    if (
      err.message.includes("FOREIGN KEY constraint failed") ||
      err.message.includes("no such table")
    ) {
      return c.json({ data: null, error: "Referenced resource not found." }, 400);
    }
  }

  return c.json({ data: null, error: "Internal server error." }, 500);
});

export default app;
