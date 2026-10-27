// ssg-poc/scripts/render-page.ts
/**
 * CLI: renderiza UNA página a HTML estático.
 *
 * Corre en un SUBPROCESS por página (lo orquesta scripts/ssg.mjs): el
 * registro del DOM (happy-dom) debe preceder a la importación de la app
 * (vanjs-core lee document al renderizar), y un proceso por página aísla
 * los singletons (i18n, router, estados) entre rutas.
 *
 * Uso:  tsx scripts/render-page.ts <url> <archivo-salida>
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "../src/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [url, outFile] = process.argv.slice(2);
if (!url || !outFile) {
  console.error("uso: tsx scripts/render-page.ts <url> <archivo-salida>");
  process.exit(1);
}

// 1) DOM global con la URL de la página (location.href = SITE_URL + path)
//    y el shell mínimo: el contenedor #app. Los assets del <head> y el
//    script del cliente los inyecta ssg-core POR STRING al serializar
//    (si <link stylesheet>/<script module> se conectan al DOM, happy-dom
//    intenta fetchearlos y lanza DOMExceptions de ruido).
GlobalRegistrator.register({ url: new URL(url, SITE_URL).href });
document.body.innerHTML = `<div id="app"></div>`;

// 2) Recién ahora importamos la app (y con ella vanjs-core).
const { renderToString } = await import("./ssg-core.js");
const html = await renderToString(url);

// 3) Escribir con pretty-URL: /es/productos → dist/es/productos/index.html.
const target = path.resolve(__dirname, "..", outFile);
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, html);
console.log("   →", outFile);

// Salir explícitamente: el registro global deja listeners vivos.
process.exit(0);
