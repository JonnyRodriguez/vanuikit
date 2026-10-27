import { describe, test, expect } from "bun:test";
import { makeSsrApp } from "../server/ssr.js";

const app = makeSsrApp();

describe("SSR server — i18n por URL (locale en el path)", () => {
  test("es: renderiza en español, con lang, canonical y hreflang", async () => {
    const res = await app.request("/es/producto/teclado-mecanico");
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain('lang="es"');
    expect(html).toContain('data-locale="es"');
    expect(html).toContain("Agregar al carrito");
    expect(html).toContain("Teclado Mecánico RGB"); // slug canónico (no traducido)
    expect(html).toContain("Switch rojo"); // descripción es

    expect(html).toContain(
      'rel="canonical" href="http://localhost/es/producto/teclado-mecanico"',
    );
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="fr"');
    expect(html).toContain('href="http://localhost/en/producto/teclado-mecanico"');
  });

  test("en: renderiza con textos y contenido en inglés", async () => {
    const res = await app.request("/en/producto/teclado-mecanico");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('lang="en"');
    expect(html).toContain("Add to cart");
    expect(html).toContain("RGB Mechanical Keyboard");
    expect(html).toContain("Red switches");
  });

  test("fr: renderiza en francés (tercer idioma)", async () => {
    const res = await app.request("/fr/producto/teclado-mecanico");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('lang="fr"');
    expect(html).toContain("Ajouter au panier");
  });

  test("sin prefijo de idioma -> 301 al locale por defecto", async () => {
    const res = await app.request("/producto/teclado-mecanico");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/es/producto/teclado-mecanico");
  });

  test("locale no soportado -> 301 al locale por defecto", async () => {
    const res = await app.request("/xx/producto/teclado-mecanico");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/es/producto/teclado-mecanico");
  });

  test("slug inexistente -> 404 (no cae al fallback SPA)", async () => {
    const res = await app.request("/fr/producto/no-existe");
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain("Produit introuvable");
  });

  test("catálogo localizado por idioma", async () => {
    const res = await app.request("/es/productos");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Catálogo");
    expect(html).toContain("Teclado Mecánico RGB");
  });
});
