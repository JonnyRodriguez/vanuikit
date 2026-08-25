import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.log("==> [1/4] Typecheck con tsc...");
execSync("tsc -b", { stdio: "inherit" });

console.log("==> [2/4] Bundling vanui/dist/index.js...");
execSync("bun build vanui/src/index.ts --outfile=vanui/dist/index.js --target=browser --external=vanjs-core", {
  stdio: "inherit",
});

console.log("==> [3/4] Bundling demo/dist/main.js...");
execSync("bun build demo/main.ts --outfile=demo/dist/main.js --target=browser", {
  stdio: "inherit",
});

console.log("==> [4/4] Generando estilos CSS con UnoCSS...");
execSync("node demo/scripts/uno.js", { stdio: "inherit" });

console.log("✅ Build completado exitosamente.");
