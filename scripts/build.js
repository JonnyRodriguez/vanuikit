import { execSync } from "node:child_process";
import fs from "node:fs";

function run(cmd, label) {
  console.log(`==> ${label}`);
  execSync(cmd, { stdio: "inherit" });
}

// Asegurar enlace simbólico de vanui en node_modules para resolución limpia
if (!fs.existsSync("./node_modules/vanui")) {
  fs.symlinkSync("../vanui", "./node_modules/vanui", "junction");
}

// [1/4] Typecheck con tsc
run("tsc --noEmit", "[1/4] Typecheck con tsc...");

// [2/4] Bundling vanui/dist/index.js
run(
  "bun build vanui/src/index.ts --outfile=vanui/dist/index.js --target=browser --external=vanjs-core",
  "[2/4] Bundling vanui/dist/index.js...",
);

// [3/4] Bundle del cliente de la demo (SPA)
run(
  "bun build demo/main.ts --outfile=demo/dist/main.js --target=browser",
  "[3/4] Bundling demo/dist/main.js...",
);

// [4/4] Generar estilos CSS con UnoCSS (demo/dist/uno.css, demo/dist/vanui.css)
run("node demo/scripts/uno.js", "[4/4] Generando estilos CSS con UnoCSS...");

console.log("✅ Build completado exitosamente.");


