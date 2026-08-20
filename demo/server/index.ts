// server/index.ts
/**
 * Punto de entrada del backend demo — equivalente a store/api/src/index.ts.
 *
 * Patron:
 *   1. App Hono con middleware CORS
 *   2. createApiRouter escanea server/controllers/ dinamicamente
 *   3. API montada bajo el prefijo global /api
 *   4. serveStatic para archivos frontend (HTML, CSS, bundles)
 *   5. SPA fallback: notFound sirve index.html para rutas cliente
 *
 * Ejecutar:  node demo/server/index.js (o tsx demo/server/index.ts)
 * Navegar:   http://localhost:3000
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApiRouter } from "./apiRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoDir = path.resolve(__dirname, "..");

const app = new Hono();

// --- Middleware ---
// CORS: permite a la SPA en desarrollo (mismo origen, pero por si acaso)
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

// --- API Router (controladores PHP-style) ---
// Escanea server/controllers/ y monta cada *.controller.ts en /api/{resource}
const controllersDir = path.join(__dirname, "controllers");
const apiRouter = await createApiRouter(controllersDir);
app.route("/api", apiRouter);

// --- Health check ---
app.get("/health", (c) => {
  return c.json({
    service: "vanui-demo-api",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// --- Static assets serving ---
// Serves static files from demo directory
app.use("/*", serveStatic({
  root: path.relative(process.cwd(), demoDir),
}));

// --- SPA fallback ---
// Para un demo SPA de pagina unica: cualquier ruta que no sea /api/*, /health
// o un archivo estatico sirve index.html (el router cliente resuelve el resto).
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

