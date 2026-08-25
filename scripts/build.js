import { execSync } from "node:child_process";

/**
 * Orquesta el build del monorepo (vanui + demo).
 *
 * El orden es importante: el demo consume `vanui` como paquete (file:../vanui),
 * así que su typecheck y su bundle necesitan que `vanui/dist/` (bundle + tipos)
 * exista primero. Construimos la librería, luego typecheck, luego el bundle del
 * demo y por último los estilos UnoCSS.
 */

function run(cmd, label) {
  console.log(`==> ${label}`);
  execSync(cmd, { stdio: "inherit" });
}

// [1/4] Construir la librería vanui (CSS + bundle + declaraciones de tipos).
// Necesario para que tsc y bun resuelvan `vanui` desde su dist/.
run(
  "cd vanui && npm run css && npm run bundle && npm run types",
  "[1/4] Construyendo vanui (dist/vanui.css + dist/index.js + dist/*.d.ts)...",
);

// [2/4] Typecheck global: ahora demo resuelve `vanui` desde su dist/
run("tsc -b", "[2/4] Typecheck con tsc...");

// [3/4] Bundle del cliente de la demo (SPA)
run(
  "bun build demo/main.ts --outfile=demo/dist/main.js --target=browser",
  "[3/4] Bundling demo/dist/main.js...",
);

// [4/4] Generar estilos CSS con UnoCSS (demo/dist/uno.css, demo/dist/vanui.css)
run("node demo/scripts/uno.js", "[4/4] Generando estilos CSS con UnoCSS...");

console.log("✅ Build completado exitosamente.");
