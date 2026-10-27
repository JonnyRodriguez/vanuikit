// ssr-poc/server/index.ts
/**
 * Servidor Hono de la POC (dev): sirve las rutas SSR y los estáticos
 * (dist/ssr-hydrate.js y assets/).
 */
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { makeSsrApp } from "./ssr.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const app = new Hono();

// Rutas SSR (productos + i18n por URL).
app.route("/", makeSsrApp());

// Raíz: página de entrada de la POC.
app.get("/", async (c) => c.html(await readFile(path.join(root, "index.html"), "utf8")));

// Estáticos: dist/ssr-hydrate.js y assets/.
app.get("/dist/*", serveStatic({ root }));
app.get("/assets/*", serveStatic({ root }));

const port = Number(process.env.PORT ?? 3100);
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
console.log(`SSR POC -> http://localhost:${port}`);
console.log(`  /es/producto/teclado-mecanico`);
console.log(`  /en/producto/teclado-mecanico`);
console.log(`  /fr/producto/teclado-mecanico`);
