import { execSync } from "node:child_process";

function run(cmd, label, cwd) {
  console.log(`==> ${label}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

// La raíz es un workspace (vanuikit + demo): node_modules se enlaza con bun/npm
// install y cada paquete tiene su propio pipeline. Esto solo orquesta el orden.

// [1/4] Typecheck de la librería
run("npm run typecheck", "[1/4] Typecheck vanuikit...", "vanuikit");

// [2/4] Build de la librería: css + bundles (cliente y server) + tipos .d.ts
run("npm run build", "[2/4] Build vanuikit (css, bundles, tipos)...", "vanuikit");

// [3/4] Typecheck de la demo (resuelve vanuikit desde node_modules, como un consumidor real)
run("npm run typecheck", "[3/4] Typecheck demo...", "demo");

// [4/4] Build de la demo: bundle del cliente + estilos
run("npm run build", "[4/4] Build demo (bundle, estilos)...", "demo");

console.log("✅ Build completado exitosamente.");
