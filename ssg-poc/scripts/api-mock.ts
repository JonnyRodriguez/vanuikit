// ssg-poc/scripts/api-mock.ts
/**
 * Mock de la API para BUILD (happy-dom) y tests: resuelve los endpoints del
 * catálogo con latencia real y REGISTRA lo servido — ese registro es el
 * payload que el SSG embebe en cada página.
 *
 * En runtime (CDN/preview) no existe: el cliente usa fetch de verdad; los
 * seeds sólo evitan el flash del primer render.
 */
import { PRODUCTS, findProduct } from "../src/catalog.js";
import { sleep } from "../src/wait.js";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export interface MockApi {
  /** Ruta de API → datos servidos (exactamente lo que debe ir embebido). */
  served(): Record<string, unknown>;
}

/** Instala el mock en globalThis.fetch (happy-dom no tiene red real). */
export const installMockApi = (latencyMs = 30): MockApi => {
  const served = new Map<string, unknown>();

  (globalThis as any).fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(rawUrl, window.location.href).pathname;

    await sleep(latencyMs); // latencia simulada: el SSG debe SABER esperar

    if (path === "/api/products") {
      served.set(path, PRODUCTS);
      return jsonResponse({ data: PRODUCTS });
    }

    const match = path.match(/^\/api\/products\/([^/]+)$/);
    if (match) {
      const product = findProduct(decodeURIComponent(match[1]));
      if (!product) return jsonResponse({ error: "not-found" }, 404);
      served.set(path, product);
      return jsonResponse({ data: product });
    }

    return jsonResponse({ error: `unmocked: ${path}` }, 404);
  };

  return { served: () => Object.fromEntries(served) };
};
