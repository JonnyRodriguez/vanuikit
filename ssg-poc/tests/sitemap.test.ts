import { describe, expect, test } from "bun:test";
import { buildSitemap } from "../scripts/sitemap.mjs";
import { LOCALES, SITE_URL } from "../src/config.js";
import { PRODUCTS } from "../src/catalog.js";

describe("sitemap", () => {
  test("incluye catálogos y productos de todos los locales, con hreflang y x-default", () => {
    const xml = buildSitemap({
      siteUrl: SITE_URL,
      locales: LOCALES,
      slugs: PRODUCTS.map((p) => p.slug),
    });

    // Catálogos × locales
    expect(xml).toContain(`<loc>${SITE_URL}/es/productos</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/en/productos</loc>`);
    // Detalles × locales
    expect(xml).toContain(`<loc>${SITE_URL}/es/producto/teclado-mecanico</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/en/producto/teclado-mecanico</loc>`);

    // Alternates hreflang dentro de una entrada (la del teclado en es)
    const entry = xml.split("<url>").find((block) => block.includes("/es/producto/teclado-mecanico</loc>"))!;
    expect(entry).toContain(`hreflang="en" href="${SITE_URL}/en/producto/teclado-mecanico"`);
    expect(entry).toContain('hreflang="x-default"');

    // Un <loc> por página: (1 catálogo + N productos) × locales
    const locs = xml.match(/<loc>/g)?.length ?? 0;
    expect(locs).toBe((1 + PRODUCTS.length) * LOCALES.length);
  });
});
