// ssg-poc/scripts/ssg.mjs
/**
 * Orquestador SSG: lanza un subprocess (render-page.ts) por página y arma
 * dist/ listo para un CDN de archivos estáticos (Cloudflare Pages, etc.).
 *
 *   dist/<locale>/productos/index.html            ← /<locale>/productos
 *   dist/<locale>/producto/<slug>/index.html      ← /<locale>/producto/<slug>
 *   dist/404.html                                 ← render de un slug inexistente
 *   dist/index.html                               ← entrada manual (links)
 *   dist/_assets/{app.js, vanui.css, site.css}
 *
 * Uso:  npm run ssg   (requiere antes `npm run build:client` para app.js)
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, SITE_URL } from "../src/config.js";
import { PRODUCTS } from "../src/catalog.js";
import { writeSitemap } from "./sitemap.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const tsxBin = path.join(root, "node_modules", ".bin", "tsx");
const renderPage = path.join(__dirname, "render-page.ts");

mkdirSync(dist, { recursive: true });

// ---- Páginas a pre-renderizar -----------------------------------------
// out es relativo a la RAÍZ del paquete (render-page.ts lo resuelve ahí).
const pages = [];
for (const locale of LOCALES) {
  pages.push({ url: `/${locale}/productos`, out: `dist/${locale}/productos/index.html` });
  for (const product of PRODUCTS) {
    pages.push({
      url: `/${locale}/producto/${product.slug}`,
      out: `dist/${locale}/producto/${product.slug}/index.html`,
    });
  }
}
// 404.html: se renderiza un slug inexistente (el CDN la sirve con status
// 404 en despliegues que lo soportan).
pages.push({ url: "/es/producto/no-existe", out: "dist/404.html" });

console.log(`SSG — renderizando ${pages.length} páginas (vanjs-core real sobre happy-dom)…`);
for (const { url, out } of pages) {
  const result = spawnSync(tsxBin, [renderPage, url, out], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error(`✗ falló ${url}`);
    process.exit(1);
  }
}

// ---- Assets ------------------------------------------------------------
const assetsDir = path.join(dist, "_assets");
mkdirSync(assetsDir, { recursive: true });

const copies = [
  { from: path.join(root, "dist", "_assets", "app.js"), to: "app.js", required: true },
  { from: path.join(root, "..", "vanui", "dist", "vanui.css"), to: "vanui.css", required: true },
  { from: path.join(root, "assets", "site.css"), to: "site.css", required: true },
];
for (const { from, to, required } of copies) {
  if (existsSync(from)) {
    copyFileSync(from, path.join(assetsDir, to));
  } else if (required) {
    console.warn(`   ⚠️ falta ${path.relative(root, from)} — corre ` +
      (to === "app.js" ? "`npm run build:client`" : "el paso correspondiente"));
  }
}

// ---- Índice manual (entrada para humanos, no para el crawler) ----------
const links = LOCALES.map(
  (locale) =>
    `<li><strong>/${locale}/</strong> — ${PRODUCTS.map(
      (p) => `<a href="/${locale}/producto/${p.slug}/">${p.name}</a>`,
    ).join(" · ")} · <a href="/${locale}/productos/">Catálogo</a></li>`,
).join("\n  ");

writeFileSync(
  path.join(dist, "index.html"),
  `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>POC #2 · SSG vanui → CDN</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 3rem auto; padding: 0 1rem; }
    .note { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: .75rem 1rem; font-size: .9rem; }
    ul { line-height: 2; }
  </style>
</head>
<body>
  <h1>🧪 POC #2 — sitio vanui real, pre-renderizado (SSG) para CDN</h1>
  <p>Cada página es HTML completo (contenido + head SEO + payload JSON). El bundle del cliente remonta sobre el HTML estático sin flash.</p>
  <ul>
  ${links}
  </ul>
  <p class="note">💡 Sirve <code>dist/</code> con cualquier estático (acá: <code>npm run preview</code>). Los links de producto navegan por SPA (router vanui) y los deep links caen en HTML pre-renderizado.</p>
</body>
</html>
`,
);

// ---- Sitemap (todas las URLs × locales, con hreflang) -------------------
writeSitemap(path.join(dist, "sitemap.xml"), {
  siteUrl: SITE_URL,
  locales: LOCALES,
  slugs: PRODUCTS.map((p) => p.slug),
});
console.log("   → dist/sitemap.xml");

console.log(`\n✅ SSG listo en dist/ (${pages.length} páginas, ${LOCALES.length} idiomas × ${PRODUCTS.length} productos)`);
console.log("   Vista local:  npm run preview");
