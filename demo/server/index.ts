// server/index.ts
/**
 * Punto de entrada del backend demo (Hono + Node.js / Bun).
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

// --- Middleware global CORS ---
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// --- Carga dinámica de rutas desde server/routes/ (desde la librería) ---
// Deny-by-default: con `auth`, TODA ruta queda protegida salvo las que
// exporten `meta = { public: true }` (hoy solo auth.route.ts).
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
    // root es relativo al cwd; `|| "."` cubre el caso cwd === demoDir, donde
    // path.relative devuelve "" y join("", "/dist/x") produciría /dist/x absoluto.
    root: path.relative(process.cwd(), demoDir) || ".",
    // Sirve .br/.gz precomprimidos en build según Accept-Encoding.
    precompressed: true,
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

const port = Number(process.env.PORT ?? 3000);
serve({
  fetch: app.fetch,
  port: port,
  hostname: "0.0.0.0",
});

console.log(`Servidor Hono (demo) -> http://0.0.0.0:${port}`);
