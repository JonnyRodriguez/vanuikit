// ssr-poc/scripts/build-ssr.js
/**
 * Bundle del cliente de hidratación (SSR) de la POC.
 *
 * Entrada: src/hydrate.ts
 * Salida: dist/ssr-hydrate.js (minificado)
 *
 * Es el JS que cargan las páginas SSR para hidratar las tarjetas con
 * van.hydrate. Se genera con `npm run build:bundle`.
 */
import { build } from "esbuild";

await build({
  entryPoints: ["src/hydrate.ts"],
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: false,
  outfile: "dist/ssr-hydrate.js",
});

console.log("✓ SSR hydrate bundle generado (dist/ssr-hydrate.js)");
