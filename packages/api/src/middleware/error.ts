import type { Context, Next } from "hono";

/**
 * Global error handler middleware.
 * Catches D1 / database errors and any other unhandled exceptions,
 * returning a consistent { data: null, error: string } JSON payload.
 */
export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
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
  }
}
