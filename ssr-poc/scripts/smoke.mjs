// ssr-poc/scripts/smoke.mjs
/**
 * Smoke test del servidor dev: levanta el server en un puerto alterno y
 * comprueba rutas SSR, redirect 301 y servir de estáticos.
 *
 * Uso:  node scripts/smoke.mjs
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsxBin = path.resolve(__dirname, "../node_modules/.bin/tsx");

const PORT = 3199;
const child = spawn(tsxBin, ["server/index.ts"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: String(PORT) },
});

await sleep(2000);

const base = `http://localhost:${PORT}`;
const get = async (p) => {
  const r = await fetch(base + p);
  return { status: r.status, text: await r.text() };
};

const results = [];

{
  const r = await get("/");
  results.push(["/", r.status, r.text.includes("Prueba de Concepto SSR") ? "index ok" : "UNEXPECTED"]);
}
{
  const r = await get("/es/producto/teclado-mecanico");
  results.push(["/es/producto/teclado-mecanico", r.status, r.text.includes('lang="es"') && r.text.includes("Agregar al carrito") ? "ssr es ok" : "UNEXPECTED"]);
}
{
  const r = await get("/en/producto/teclado-mecanico");
  results.push(["/en/producto/teclado-mecanico", r.status, r.text.includes('lang="en"') && r.text.includes("Add to cart") ? "ssr en ok" : "UNEXPECTED"]);
}
{
  const r = await fetch(base + "/producto/teclado-mecanico", { redirect: "manual" });
  results.push(["/producto/... (redirect)", r.status, r.headers.get("location") ?? "no-location"]);
}
for (const [p, label] of [
  ["/assets/style.css", "css"],
  ["/assets/img/teclado.svg", "img"],
  ["/dist/ssr-hydrate.js", "bundle"],
]) {
  const r = await get(p);
  results.push([p, r.status, `${label} ok`]);
}

child.kill();

for (const [p, status, note] of results) {
  console.log(`  ${String(status).padStart(3)}  ${p.padEnd(42)}  ${note}`);
}

const failed = results.some(([, s]) => s !== 200 && s !== 301);
console.log(failed ? "\n❌ Smoke FAIL" : "\n✅ Smoke OK");
process.exit(failed ? 1 : 0);
