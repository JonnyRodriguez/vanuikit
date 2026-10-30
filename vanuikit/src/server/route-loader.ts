// vanuikit/src/server/route-loader.ts
/**
 * loadRoutes — Escáner recursivo y cargador automático de rutas Hono
 * con política **deny-by-default**.
 *
 * Busca archivos *.route.ts o *.route.js dentro de routesDir y los monta
 * respetando la jerarquía de carpetas:
 *
 *   routes/api/auth.route.ts     ->  /api/auth
 *   routes/api/***REMOVED***.route.ts  ->  /api/***REMOVED***
 *
 * Cada archivo exporta un sub-app Hono por default (o por named `route`).
 *
 * Seguridad (deny-by-default): si se pasa `options.auth`, TODA ruta queda
 * protegida con ese guard, salvo los archivos que declaren lo contrario:
 *
 *   export const meta = { public: true };   // opt-out explícito
 *
 * Así el error del programador ya no puede ser el peligroso (olvidar
 * proteger); el error posible es el inocuo al revés: una ruta que debía
 * ser pública pide login, y se ve al instante.
 *
 * Requiere un runtime capaz de importar los archivos de ruta (tsx/bun, o
 * rutas ya compiladas a .js).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Hono, type MiddlewareHandler } from "hono";

/** Meta opcional que un archivo de ruta puede exportar junto al sub-app. */
export type RouteMeta = {
  /**
   * Marca el archivo como público (sin el guard de autenticación).
   * Por defecto, con `auth` configurado, TODO es protegido.
   */
  public?: boolean;
};

/** Info de una ruta cargada (para el callback `onLoad`). */
export type LoadedRouteInfo = {
  /** Ruta montada, p. ej. "/api/auth". */
  path: string;
  /** Archivo relativo a routesDir, p. ej. "api/auth.route.ts". */
  file: string;
  /** `true` si el guard de `options.auth` quedó aplicado. */
  protected: boolean;
};

export type LoadRoutesOptions = {
  /**
   * Middleware de autenticación (p. ej. `requireAuth()`). Si se pasa, todas
   * las rutas quedan protegidas salvo las que exporten `meta = { public: true }`.
   */
  auth?: MiddlewareHandler;
  /**
   * Callback opcional por ruta cargada. La librería no loguea sola: la app
   * decide (p. ej. `onLoad: (i) => console.log(i.path, i.file, i.protected)`).
   */
  onLoad?: (info: LoadedRouteInfo) => void;
};

/** Envuelve el sub-app en uno nuevo con el guard delante (orden Hono: el middleware debe registrarse antes que los handlers). */
function withGuard(app: Hono, guard: MiddlewareHandler): Hono {
  const wrapped = new Hono();
  wrapped.use("*", guard);
  wrapped.route("/", app);
  return wrapped;
}

export async function loadRoutes(
  routesDir: string,
  options: LoadRoutesOptions = {},
): Promise<Hono> {
  const rootApp = new Hono();

  if (!fs.existsSync(routesDir)) {
    console.warn(`⚠ El directorio de rutas no existe: ${routesDir}`);
    return rootApp;
  }

  async function scanDirectory(dir: string, baseRoute = "") {
    // Orden determinista: el orden de registro afecta el matcheo de rutas
    // en Hono, y readdirSync no garantiza orden del filesystem.
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath, `${baseRoute}/${entry.name}`);
        continue;
      }
      if (!entry.isFile() || !(entry.name.endsWith(".route.ts") || entry.name.endsWith(".route.js"))) {
        continue;
      }

      const routeSegment = entry.name.replace(/\.route\.(ts|js)$/, "");
      const routePath = `${baseRoute}/${routeSegment}`.replace(/\/+/g, "/");

      try {
        const routeModule = await import(pathToFileURL(fullPath).href);
        const routeApp = routeModule.default || routeModule.route;

        if (!routeApp) {
          console.warn(`⚠ El archivo de ruta ${entry.name} no exporta un 'default' de Hono.`);
          continue;
        }

        const meta: RouteMeta = routeModule.meta ?? {};
        const protectedRoute = Boolean(options.auth) && meta.public !== true;
        const mounted = protectedRoute ? withGuard(routeApp, options.auth!) : routeApp;
        rootApp.route(routePath, mounted);

        options.onLoad?.({
          path: routePath,
          file: path.relative(routesDir, fullPath),
          protected: protectedRoute,
        });
      } catch (error) {
        console.error(`❌ Error al cargar la ruta ${entry.name}:`, error);
      }
    }
  }

  await scanDirectory(routesDir);
  return rootApp;
}
