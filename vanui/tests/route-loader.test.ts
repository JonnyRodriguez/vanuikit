import { describe, test, expect, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { loadRoutes, type LoadedRouteInfo } from "../src/server/route-loader.js";

const tmpDirs: string[] = [];

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * Crea un directorio temporal con archivos de ruta (contenido TS real).
 * Vive DENTRO de tests/fixtures para que `import "hono"` resuelva caminando
 * hasta los node_modules del paquete — en /tmp no hay resolución.
 */
function makeRoutesDir(files: Record<string, string>): string {
  const fixturesDir = path.join(import.meta.dir, "fixtures");
  fs.mkdirSync(fixturesDir, { recursive: true });
  const dir = fs.mkdtempSync(path.join(fixturesDir, "tmp-routes-"));
  tmpDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

const APP_BODY = `import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => c.json({ ok: true }));
export default app;`;

const GUARD = async (_c: any, next: () => Promise<void>) => next();

describe("loadRoutes (deny-by-default)", () => {
  test("con auth, un archivo SIN meta queda protegido: el guard corre antes del handler", async () => {
    const dir = makeRoutesDir({ "api/payment.route.ts": APP_BODY });
    let guardRuns = 0;
    const guard = async (_c: any, next: () => Promise<void>) => {
      guardRuns++;
      await next();
    };

    const app = await loadRoutes(dir, { auth: guard });
    const res = await app.request("/api/payment");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(guardRuns).toBe(1);
  });

  test("meta { public: true } marca la excepción: el guard no corre", async () => {
    const dir = makeRoutesDir({
      "api/auth.route.ts": `import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => c.json({ ok: true }));
export default app;
export const meta = { public: true };`,
    });
    let guardRuns = 0;
    const guard = async (_c: any, next: () => Promise<void>) => {
      guardRuns++;
      await next();
    };

    const app = await loadRoutes(dir, { auth: guard });
    const res = await app.request("/api/auth");

    expect(res.status).toBe(200);
    expect(guardRuns).toBe(0);
  });

  test("sin auth en options no hay protección (comportamiento básico)", async () => {
    const dir = makeRoutesDir({ "ping.route.ts": APP_BODY });
    const loaded: LoadedRouteInfo[] = [];

    const app = await loadRoutes(dir, { onLoad: (i) => loaded.push(i) });
    const res = await app.request("/ping");

    expect(res.status).toBe(200);
    expect(loaded).toEqual([{ path: "/ping", file: "ping.route.ts", protected: false }]);
  });

  test("respeta la jerarquía de carpetas y reporta por onLoad", async () => {
    const dir = makeRoutesDir({
      "api/payment.route.ts": APP_BODY,
      "api/auth.route.ts": APP_BODY.replace("export default app;", "export default app;\nexport const meta = { public: true };"),
    });
    const loaded: LoadedRouteInfo[] = [];

    const app = await loadRoutes(dir, {
      auth: GUARD,
      onLoad: (i) => loaded.push(i),
    });
    const res = await app.request("/api/payment");

    expect(res.status).toBe(200);
    expect(loaded).toEqual([
      { path: "/api/auth", file: "api/auth.route.ts", protected: false },
      { path: "/api/payment", file: "api/payment.route.ts", protected: true },
    ]);
  });

  test("directorio inexistente: app vacía sin lanzar", async () => {
    const app = await loadRoutes("/tmp/no-existe-vanui-routes-xyz");
    const res = await app.request("/cualquiera");
    expect(res.status).toBe(404);
  });
});
