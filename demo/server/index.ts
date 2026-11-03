// server/index.ts
/**
 * Demo backend entry point (Hono + Node.js / Bun).
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRoutes } from "vanuikit/server";
import { requireAuth } from "./middlewares/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoDir = path.resolve(__dirname, "..");

const app = new Hono();

// --- Global CORS middleware ---
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// --- Dynamic loading of routes from server/routes/ (from the library) ---
// Deny-by-default: with `auth`, every route is protected except those that
// export `meta = { public: true }` (currently only auth.route.ts).
const routesDir = path.join(__dirname, "routes");
const routesApp = await loadRoutes(routesDir, {
  auth: requireAuth(),
  onLoad: (i) =>
    console.log(
      `[RouterLoader] ${i.path} <- ${i.file}${i.protected ? "" : " (pública)"}`,
    ),
});
app.route("/", routesApp);

// --- Health check ---
app.get("/health", (c) => {
  return c.json({
    service: "vanuikit-demo-api",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// --- Static assets serving ---
app.use(
  "/*",
  serveStatic({
    // root is relative to the cwd; `|| ".` covers the case cwd === demoDir, where
    // path.relative returns "" and join("", "/dist/x") would produce an absolute /dist/x.
    root: path.relative(process.cwd(), demoDir) || ".",
    // Serves precompressed .br/.gz in build based on Accept-Encoding.
    precompressed: true,
  }),
);

// --- SPA fallback ---
// Serves index.html so the VanJS router resolves client routes
app.notFound((c) => {
  const url = new URL(c.req.url);
  if (!url.pathname.startsWith("/api") && !url.pathname.startsWith("/health")) {
    const htmlPath = path.join(demoDir, "index.html");
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, "utf-8");
      return c.html(html);
    }
  }
  return c.json({ error: "Ruta no encontrada" }, 404);
});

const port = Number(process.env.PORT ?? 3000);
serve({
  fetch: app.fetch,
  port: port,
  hostname: "0.0.0.0",
});

console.log(`Servidor Hono (demo) -> http://0.0.0.0:${port}`);
