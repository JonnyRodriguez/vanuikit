// ssg-poc/scripts/build-client.mjs
/**
 * Bundle del cliente de takeover (src/client.ts → dist/_assets/app.js).
 *
 * Verifica el metafile de esbuild: el bundle debe contener EXACTAMENTE UNA
 * copia de vanjs-core (regla del repo — dos copias = dos sistemas de estado
 * que no se hablan). vanui entra pre-bundled desde su dist (file dep), que
 * ya externaliza vanjs-core, así que las importaciones colapsan en una.
 */
import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "dist", "_assets");
mkdirSync(assetsDir, { recursive: true });

const result = await build({
  entryPoints: [path.join(root, "src", "client.ts")],
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: false,
  outfile: path.join(assetsDir, "app.js"),
  metafile: true,
  // SITE_URL es constante de BUILD (el origin canónico se hornea en el
  // bundle): inlinear process.env — en el navegador no existe `process`.
  define: {
    "process.env.SITE_URL": JSON.stringify(process.env.SITE_URL ?? "https://vanui-ssg.example.com"),
  },
});

const vanCopies = new Set(
  Object.keys(result.metafile.inputs).filter((k) => k.includes("node_modules/vanjs-core")),
);
if (vanCopies.size !== 1) {
  console.error(`✗ se esperaba 1 copia de vanjs-core en el bundle, hay ${vanCopies.size}:`);
  for (const copy of vanCopies) console.error("   ", copy);
  process.exit(1);
}

copyFileSync(path.join(root, "..", "vanui", "dist", "vanui.css"), path.join(assetsDir, "vanui.css"));
copyFileSync(path.join(root, "assets", "site.css"), path.join(assetsDir, "site.css"));

const sizeKb = (result.metafile.outputs[path.join("dist", "_assets", "app.js")]?.bytes ?? 0) / 1024;
console.log(`✓ app.js generado (dist/_assets/app.js, ${sizeKb.toFixed(1)} KB) — 1 copia de vanjs-core ✓`);
