import { cors } from "hono/cors";

/**
 * CORS middleware configured for the Vite dev server origin and the
 * production Cloudflare Pages deployment.
 */
export const corsMiddleware = cors({
  origin: ["http://localhost:5173", "https://mega-todo-frontend.pages.dev"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
});
