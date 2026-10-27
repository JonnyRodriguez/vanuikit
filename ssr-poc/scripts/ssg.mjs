// ssr-poc/scripts/ssg.mjs
/**
 * Genera el sitio estático (SSG) de la POC en dist/ssg/.
 *
 *   dist/ssg/<locale>/productos/index.html
 *   dist/ssg/<locale>/producto/<slug>.html
 *   dist/ssg/_assets/   ← style.css, imágenes y bundle de hidratación
 *
 * Se copian los assets y se reescriben las rutas a relativas para que todo
 * se abra directo desde el filesystem (o un CDN como Cloudflare Pages).
 *
 * Uso:  npm run ssg
 */
import {
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeSsrApp, LOCALES } from "../server/ssr.js";
import { PRODUCTS } from "../src/catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../dist/ssg");

const app = makeSsrApp();
const write = (rel, html) => {
  const p = path.join(outDir, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, html);
  console.log("   →", rel);
};

// /assets/* y /dist/* se reescriben a ./_assets/* (rutas relativas).
const toRelative = (html) =>
  html.split("/assets/").join("./_assets/").split("/dist/").join("./_assets/");

for (const l of LOCALES) {
  const catalogRes = await app.request(`/${l}/productos`);
  if (catalogRes.status === 200) {
    write(`${l}/productos/index.html`, toRelative(await catalogRes.text()));
  }
  for (const pr of PRODUCTS) {
    const res = await app.request(`/${l}/producto/${pr.slug}`);
    if (res.status === 200) {
      write(`${l}/producto/${pr.slug}.html`, toRelative(await res.text()));
    }
  }
}

// Assets → _assets/ (style.css + imágenes).
const assetsSrc = path.join(__dirname, "../assets");
const assetsDest = path.join(outDir, "_assets");
mkdirSync(assetsDest, { recursive: true });
const copyTree = (src, dest) => {
  if (!existsSync(src)) return;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(d, { recursive: true });
      copyTree(s, d);
    } else {
      copyFileSync(s, d);
    }
  }
};
copyTree(assetsSrc, assetsDest);

// Bundle de hidratación → _assets/.
const hydrateDist = path.join(__dirname, "../dist/ssr-hydrate.js");
if (existsSync(hydrateDist)) {
  copyFileSync(hydrateDist, path.join(assetsDest, "ssr-hydrate.js"));
} else {
  console.warn("   ⚠️ falta dist/ssr-hydrate.js (corre antes npm run build:bundle)");
}

// Página índice.
const links = LOCALES.map(
  (l) =>
    `<li><strong>/${l}/</strong> — ${PRODUCTS.map(
      (p) => `<a href="${l}/producto/${p.slug}.html">${p.name}</a>`,
    ).join(" · ")}</li>`,
).join("\n    ");
write(
  "index.html",
  `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Prueba de Concepto · SSR + i18n por URL</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 3rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 1.4rem; }
    .note { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: .75rem 1rem; font-size: .9rem; }
    ul { line-height: 2; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>🧪 Prueba de Concepto — VanUI + SSR + i18n por URL</h1>
  <p>Páginas generadas como <strong>HTML estático</strong> (SSG), listas para subir a un CDN (Cloudflare Pages). Cada una trae su contenido SEO completo (canonical, hreflang) y el bundle de hidratación.</p>
  <ul>
    ${links}
  </ul>
  <p class="note">💡 El bundle de hidratación (<code>_assets/ssr-hydrate.js</code>) pesa ~1.7 KB gzip. Abre una página de producto y haz clic en <strong>+</strong> / <strong>−</strong>: la cantidad actualiza (reactividad de VanJS tras <code>van.hydrate</code>).</p>
</body>
</html>
`,
);

console.log(`\n✅ SSG generado en dist/ssg (${LOCALES.length} idiomas × ${PRODUCTS.length} productos)`);
