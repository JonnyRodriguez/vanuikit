// server/apiRouter.ts
/**
 * apiRouter — escáner dinámico de controladores.
 *
 * Patrón: store / CakePHP resource controllers. Cada archivo
 * `{resource}.controller.ts` en server/controllers/ define un sub-router
 * de Hono. El nombre del archivo determina el prefijo de URL:
 *
 *   auth.controller.ts     →  POST /api/auth/login, POST /api/auth/register
 *   ***REMOVED***.controller.ts  →  GET  /api/***REMOVED***/***REMOVED***, POST /api/***REMOVED***/***REMOVED***
 *
 * Equivalente al apiRouter.ts del paquete `store` (../store/api/src/apiRouter.ts).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Hono } from "hono";

export async function createApiRouter(controllersDir: string): Promise<Hono> {
  const api = new Hono();

  if (!fs.existsSync(controllersDir)) {
    console.warn(`⚠ El directorio de controladores no existe: ${controllersDir}`);
    return api;
  }

  const files = fs.readdirSync(controllersDir);

  for (const file of files) {
    if (file.endsWith(".controller.ts") || file.endsWith(".controller.js")) {
      const routeName = file.replace(/\.controller\.(ts|js)$/, "");
      const routePath = "/" + routeName;
      const fullPath = path.join(controllersDir, file);

      try {
        const controllerModule = await import(pathToFileURL(fullPath).href);
        const controllerApp = controllerModule.default;

        if (controllerApp) {
          api.route(routePath, controllerApp);
          console.log("[API] Ruta registrada: /api" + routePath + " <-- " + file);
        } else {
          console.warn("⚠  El controlador " + file + " no exporta un 'default' de Hono.");
        }
      } catch (error) {
        console.error("❌ Error al cargar el controlador " + file + ":", error);
      }
    }
  }

  return api;
}
