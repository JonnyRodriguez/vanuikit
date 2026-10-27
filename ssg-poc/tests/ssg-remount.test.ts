/**
 * Tests de la POC #2 — SSG de sitio vanui real.
 *
 * Replican en-process el flujo completo de build y takeover:
 *   build:   setPath(url) → mock de API → boot() → waitForReady → (serializar)
 *   cliente: pushPayload(mock.served()) → boot() de nuevo (remount)
 *
 * El assertion central: el remount con seeds produce EXACTAMENTE el mismo
 * DOM que el render sin seeds — eso es lo que hace invisible el takeover.
 */
import { describe, test, expect, beforeEach } from "bun:test";
import { installMockApi, type MockApi } from "../scripts/api-mock.js";
import { boot } from "../src/app.js";
import { resetSeeds, pushPayload } from "../src/data.js";
import { sleep, waitForReady } from "../src/wait.js";
import { SITE_URL } from "../src/config.js";

const setPath = (path: string) => window.history.replaceState({}, "", path);
const appHtml = () => document.getElementById("app")!.innerHTML;
const canonical = () =>
  document.head.querySelector('link[rel="canonical"]')?.getAttribute("href");

describe("SSG de sitio vanui real (vanjs-core sobre happy-dom)", () => {
  let mock: MockApi;

  beforeEach(() => {
    resetSeeds();
    mock = installMockApi();
  });

  test("catálogo es: HTML completo con SEO y datos (sin quedar en skeleton)", async () => {
    setPath("/es/productos");
    boot();
    await waitForReady();

    expect(document.documentElement.lang).toBe("es");
    expect(document.title).toBe("Catálogo · Tienda VanUI");
    expect(canonical()).toBe(`${SITE_URL}/es/productos`);
    expect(
      document.querySelector('link[rel="alternate"][hreflang="en"]')?.getAttribute("href"),
    ).toBe(`${SITE_URL}/en/productos`);
    expect(document.querySelector('link[rel="alternate"][hreflang="x-default"]')).toBeTruthy();

    const html = appHtml();
    expect(html).toContain("Teclado Mecánico RGB"); // datos llegaron
    expect(html).toContain("En stock");
    expect(html).toContain("Agotado");
    expect(html).toContain("/es/producto/teclado-mecanico"); // links SPA
    expect(document.querySelector('[data-loading="true"]')).toBeNull();
  });

  test("TAKEOVER: remontar con el payload embebido produce el MISMO DOM", async () => {
    setPath("/es/productos");
    boot(); // build: sin seeds, resuelve por fetch
    await waitForReady();
    const before = appHtml();

    // Cliente: carga el payload que el SSG embebió y remonta (boot → replaceChildren + van.add).
    pushPayload(mock.served());
    boot();
    await waitForReady();

    expect(appHtml()).toBe(before);
  });

  test("reactividad viva tras el takeover: qty reacciona y el head lleva el nombre", async () => {
    setPath("/es/producto/teclado-mecanico");
    boot();
    await waitForReady();

    // El head se re-aplicó al llegar la data (SEO por producto).
    await sleep(40);
    expect(document.title).toContain("Teclado Mecánico RGB");
    expect(canonical()).toBe(`${SITE_URL}/es/producto/teclado-mecanico`);

    const value = () => document.querySelector(".qty-value")?.textContent?.trim();
    expect(value()).toBe("1");

    const plus = document.querySelector<HTMLButtonElement>('button[aria-label="Aumentar cantidad"]');
    const minus = document.querySelector<HTMLButtonElement>('button[aria-label="Disminuir cantidad"]');
    expect(plus && minus).toBeTruthy();

    plus!.click();
    await sleep(40);
    expect(value()).toBe("2");

    minus!.click();
    await sleep(40);
    expect(value()).toBe("1");
  });

  test("locale en: textos, head y contenido en inglés", async () => {
    setPath("/en/productos");
    boot();
    await waitForReady();

    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Catalog · VanUI Store");
    expect(canonical()).toBe(`${SITE_URL}/en/productos`);
    const html = appHtml();
    expect(html).toContain("View product →");
    expect(html).toContain("RGB Mechanical Keyboard");
    expect(html).toContain("In stock");
  });

  test("slug inexistente → vista 404 con data-loading liberado", async () => {
    setPath("/es/producto/no-existe");
    boot();
    await waitForReady();

    expect(appHtml()).toContain("Producto no encontrado");
    expect(document.querySelector('[data-loading="true"]')).toBeNull();
  });

  test("locale no soportado → vista 404", async () => {
    setPath("/xx/productos");
    boot();
    await waitForReady();

    expect(appHtml()).toContain("Producto no encontrado");
  });
});
