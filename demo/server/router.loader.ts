// server/router.loader.ts
/**
 * router.loader — Escáner recursivo y cargador automático de rutas Hono.
 *
 * Busca archivos *.route.ts o *.route.js dentro de server/routes/
 * y monta las rutas automáticamente respetando la jerarquía de carpetas:
 *
 *   server/routes/api/auth.route.ts     ->  /api/auth/*
 *   server/routes/api/***REMOVED***.route.ts  ->  /api/***REMOVED***/*
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Hono } from "hono";

export async function loadRoutes(routesDir: string): Promise<Hono> {
  const rootApp = new Hono();

  if (!fs.existsSync(routesDir)) {
    console.warn(`⚠ El directorio de rutas no existe: ${routesDir}`);
    return rootApp;
  }

  // Exploración recursiva para soportar subdirectorios como routes/api/
  async function scanDirectory(dir: string, baseRoute: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath, `${baseRoute}/${entry.name}`);
      } else if (entry.isFile() && (entry.name.endsWith(".route.ts") || entry.name.endsWith(".route.js"))) {
        const routeSegment = entry.name.replace(/\.route\.(ts|js)$/, "");
        const routePath = `${baseRoute}/${routeSegment}`.replace(/\/+/g, "/");

        try {
          const routeModule = await import(pathToFileURL(fullPath).href);
          const routeApp = routeModule.default || routeModule.route;

          if (routeApp) {
            rootApp.route(routePath, routeApp);
            console.log(`[RouterLoader] Ruta registrada: ${routePath} <-- ${path.relative(routesDir, fullPath)}`);
          } else {
            console.warn(`⚠ El archivo de ruta ${entry.name} no exporta un 'default' de Hono.`);
          }
        } catch (error) {
          console.error(`❌ Error al cargar la ruta ${entry.name}:`, error);
        }
      }
    }
  }

  await scanDirectory(routesDir);
  return rootApp;
}
