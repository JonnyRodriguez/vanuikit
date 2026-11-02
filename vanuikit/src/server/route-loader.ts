// vanuikit/src/server/route-loader.ts
/**
 * loadRoutes — Recursive scanner and auto-loader of Hono routes
 * with a **deny-by-default** policy.
 *
 * Looks for *.route.ts or *.route.js files inside routesDir and mounts them
 * respecting the folder hierarchy:
 *
 *   routes/api/auth.route.ts     ->  /api/auth
 *   routes/api/***REMOVED***.route.ts  ->  /api/***REMOVED***
 *
 * Each file exports a Hono sub-app as default (or as the named `route`).
 *
 * Security (deny-by-default): if `options.auth` is passed, EVERY route is
 * protected with that guard, except the files that declare otherwise:
 *
 *   export const meta = { public: true };   // explicit opt-out
 *
 * This way the developer's error can no longer be the dangerous one
 * (forgetting to protect); the only possible error is the harmless opposite:
 * a route that should be public asks for login, and it shows instantly.
 *
 * Requires a runtime capable of importing the route files (tsx/bun, or
 * routes already compiled to .js).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Hono, type MiddlewareHandler } from "hono";

/** Optional meta that a route file can export alongside the sub-app. */
export type RouteMeta = {
  /**
   * Marks the file as public (without the authentication guard).
   * By default, with `auth` configured, EVERYTHING is protected.
   */
  public?: boolean;
};

/** Info about a loaded route (for the `onLoad` callback). */
export type LoadedRouteInfo = {
  /** Mounted route, e.g. "/api/auth". */
  path: string;
  /** File relative to routesDir, e.g. "api/auth.route.ts". */
  file: string;
  /** `true` if the `options.auth` guard was applied. */
  protected: boolean;
};

export type LoadRoutesOptions = {
  /**
   * Authentication middleware (e.g. `requireAuth()`). If passed, all routes
   * are protected except those exporting `meta = { public: true }`.
   */
  auth?: MiddlewareHandler;
  /**
   * Optional callback per loaded route. The library does not log on its own:
   * the app decides (e.g. `onLoad: (i) => console.log(i.path, i.file, i.protected)`).
   */
  onLoad?: (info: LoadedRouteInfo) => void;
};

/** Wraps the sub-app in a new one with the guard in front (Hono order: the middleware must be registered before the handlers). */
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
    console.warn(`⚠ Routes directory does not exist: ${routesDir}`);
    return rootApp;
  }

  async function scanDirectory(dir: string, baseRoute = "") {
    // Deterministic order: registration order affects route matching
    // in Hono, and readdirSync does not guarantee filesystem order.
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
          console.warn(`⚠ Route file ${entry.name} does not export a Hono 'default'.`);
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
        console.error(`❌ Error loading route ${entry.name}:`, error);
      }
    }
  }

  await scanDirectory(routesDir);
  return rootApp;
}
