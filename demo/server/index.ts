// server/index.ts
/**
 * Punto de entrada del backend demo (Hono + Node.js / Bun).
 *
 * Patrón:
 *   1. App Hono con middleware CORS
 *   2. createApiRouter escanea recursivamente server/routes/
 *   3. Rutas montadas automáticamente (p. ej. server/routes/api/ -> /api/*)
 *   4. serveStatic para archivos frontend (HTML, CSS, bundles)
 *   5. SPA fallback: notFound sirve index.html para el router cliente de VanJS
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRoutes } from "./router.loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoDir = path.resolve(__dirname, "..");

const app = new Hono();

// --- Middleware ---
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

// --- Carga dinámica de rutas desde server/routes/ ---
// Escanea server/routes/api/*.route.ts y los monta según su estructura de carpetas
const routesDir = path.join(__dirname, "routes");
const routesApp = await loadRoutes(routesDir);
app.route("/", routesApp);

// --- Health check ---
app.get("/health", (c) => {
  return c.json({
    service: "vanui-demo-api",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// --- Static assets serving ---
app.use(
  "/*",
  serveStatic({
    root: path.relative(process.cwd(), demoDir),
  }),
);

// --- SPA fallback ---
// Sirve index.html para que el router de VanJS resuelva las rutas cliente
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

const port = 3000;
serve({
  fetch: app.fetch,
  port: port,
  hostname: "0.0.0.0",
});

console.log(`Servidor Hono (demo) -> http://0.0.0.0:${port}`);
