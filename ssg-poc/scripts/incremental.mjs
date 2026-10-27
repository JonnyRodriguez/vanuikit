// ssg-poc/scripts/incremental.mjs
/**
 * Pipeline incremental: un producto cambió en el backend → re-renderizar
 * SUS páginas (× locales) + las de catálogo (que también quedaron viejas:
 * lista, precio, stock), regenerar el sitemap y purgar el cache de
 * Cloudflare de las URLs afectadas.
 *
 * Uso:
 *   npm run incremental -- <slug>
 *   CF_ZONE_ID=… CF_API_TOKEN=… npm run incremental -- teclado-mecanico
 *
 * Sin CF_ZONE_ID/CF_API_TOKEN hace DRY-RUN: imprime las URLs que purgaría.
 * El paso de subida al CDN queda fuera (deploy: `wrangler pages deploy dist`
 * o el sincronizador que corresponda).
 *
 * Idempotente por diseño: re-renderizar siempre es seguro; si algo falla,
 * conviene NO purgar (el HTML viejo correcto sigue mejor que uno a medias).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, SITE_URL } from "../src/config.js";
import { PRODUCTS, findProduct } from "../src/catalog.js";
import { writeSitemap } from "./sitemap.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tsxBin = path.join(root, "node_modules", ".bin", "tsx");
const renderPage = path.join(__dirname, "render-page.ts");

const slug = process.argv[2];
if (!slug || !findProduct(slug)) {
  console.error(`uso: npm run incremental -- <slug> — slug desconocido: ${slug ?? "(ninguno)"}`);
  console.error(`slugs válidos: ${PRODUCTS.map((p) => p.slug).join(", ")}`);
  process.exit(1);
}

const render = (url, out) => {
  const result = spawnSync(tsxBin, [renderPage, url, out], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`✗ falló ${url}`);
    process.exit(1);
  }
};

// Conjunto afectado por un producto: su página × locales + catálogos × locales.
const affected = [];
for (const locale of LOCALES) {
  affected.push({
    url: `/${locale}/producto/${slug}`,
    out: `dist/${locale}/producto/${slug}/index.html`,
  });
  affected.push({
    url: `/${locale}/productos`,
    out: `dist/${locale}/productos/index.html`,
  });
}

console.log(`Incremental — ${slug}: renderizando ${affected.length} páginas (${LOCALES.length} detalles + ${LOCALES.length} catálogos)…`);
for (const { url, out } of affected) render(url, out);

// El sitemap se regenera COMPLETO (es barato y vive del catálogo entero).
writeSitemap(path.join(root, "dist", "sitemap.xml"), {
  siteUrl: SITE_URL,
  locales: LOCALES,
  slugs: PRODUCTS.map((p) => p.slug),
});
console.log("   → dist/sitemap.xml");

// Purga de cache de Cloudflare: exactamente las URLs públicas afectadas.
const files = affected.map(({ url }) => `${SITE_URL}${url}`);
if (process.env.CF_ZONE_ID && process.env.CF_API_TOKEN) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    },
  );
  const json = await res.json();
  if (!json.success) {
    console.error(`✗ purge error: ${JSON.stringify(json.errors)}`);
    process.exit(1);
  }
  console.log(`✅ Cache de Cloudflare purgada (${files.length} URLs)`);
} else {
  console.log("\n[dry-run] CF_ZONE_ID/CF_API_TOKEN sin definir — URLs que se purgarían:");
  for (const file of files) console.log("   ", file);
}

console.log("\n✅ Incremental listo. Subida al CDN: wrangler pages deploy dist (o tu sincronizador).");
