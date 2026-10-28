// ssg-poc/scripts/preview.mjs
/**
 * Preview local del output SSG — simula un CDN de archivos estáticos:
 *   · pretty URLs  (/es/productos → es/productos/index.html)
 *   · /api/products y /api/products/:slug (para que el refetch post-takeover
 *     funcione igual que en producción)
 *   · 404.html con status 404 para lo desconocido
 *
 * Uso:  npm run preview   →  http://localhost:4200/
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCTS, findProduct } from "../src/catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.PORT ?? 4200);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

// Tipos compresibles (texto). Los binarios (imágenes, fuentes) ya vienen
// comprimidos: comprimirlos de nuevo no gana nada y desperdicia CPU.
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".mjs", ".json", ".svg", ".txt"]);

// Negocia la codificación de contenido que el cliente acepta.
// Orden de preferencia: brotli > gzip > identidad (sin comprimir).
const pickEncoding = (acceptEncoding = "") => {
  const accept = acceptEncoding.toLowerCase();
  if (accept.includes("br")) return "br";
  if (accept.includes("gzip") || accept.includes("deflate")) return "gzip";
  return null;
};

const compress = (content, encoding) => {
  if (encoding === "br") return brotliCompressSync(content);
  if (encoding === "gzip") return gzipSync(content);
  return content;
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);

  // API (mismo contrato que el mock de build).
  if (pathname === "/api/products") {
    const body = json({ data: PRODUCTS });
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(await body.text());
  }
  const apiMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
  if (apiMatch) {
    const product = findProduct(decodeURIComponent(apiMatch[1]));
    res.writeHead(product ? 200 : 404, { "Content-Type": "application/json" });
    return res.end(product ? JSON.stringify({ data: product }) : JSON.stringify({ error: "not-found" }));
  }

  // Estáticos con pretty URLs.
  const tryRead = async (relative) => {
    const target = path.normalize(path.join(dist, relative));
    if (!target.startsWith(dist)) return null; // path traversal
    try {
      return await readFile(target);
    } catch {
      return null;
    }
  };

  const candidates = [
    pathname,
    pathname.endsWith("/") ? path.join(pathname, "index.html") : path.join(pathname, "index.html"),
  ];
  for (const candidate of candidates) {
    const content = await tryRead(candidate);
    if (content) {
      const ext = path.extname(candidate);
      const type = MIME[ext] ?? "application/octet-stream";
      const headers = { "Content-Type": type };
      // Comprime texto si el cliente lo acepta (como un CDN real).
      if (COMPRESSIBLE.has(ext)) {
        const encoding = pickEncoding(req.headers["accept-encoding"]);
        if (encoding) {
          headers["Content-Encoding"] = encoding;
          headers["Vary"] = "Accept-Encoding";
          res.writeHead(200, headers);
          return res.end(compress(content, encoding));
        }
      }
      res.writeHead(200, headers);
      return res.end(content);
    }
  }

  const notFound = await tryRead("404.html");
  res.writeHead(404, { "Content-Type": MIME[".html"] });
  res.end(notFound ?? "404");
});

server.listen(port, () => {
  console.log(`Preview del SSG → http://localhost:${port}`);
  console.log(`  /es/productos`);
  console.log(`  /en/producto/teclado-mecanico`);
});
