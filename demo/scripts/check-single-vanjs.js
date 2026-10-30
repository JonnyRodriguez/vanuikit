/**
 * Verificación de instancia única de VanJS en el bundle de la demo.
 *
 * Dos copias de vanjs-core = dos sistemas de estado que no se hablan: la
 * reactividad se rompe en silencio. El metafile de esbuild dice exactamente
 * cuántos inputs de vanjs-core entraron; si es más de uno, el build falla.
 *
 * Uso: node scripts/check-single-vanjs.js (requiere --metafile=dist/meta.json
 * en el comando esbuild que lo precede).
 */
import fs from "node:fs";

const metaFile = new URL("../dist/meta.json", import.meta.url);
const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
const copies = Object.entries(meta.inputs).filter(([p]) => p.includes("vanjs-core"));

fs.rmSync(metaFile);

if (copies.length > 1) {
  console.error(`❌ El bundle contiene ${copies.length} copias de vanjs-core (debe ser exactamente 1):`);
  for (const [p, i] of copies) console.error(`   ${((i.bytes ?? 0) / 1024).toFixed(1)}KB ${p}`);
  console.error("Pista: versiones divergentes entre package.json de la app y vanuikit, o un import directo de vanjs-core (usar `van` desde vanuikit).");
  process.exit(1);
}

console.log(
  `✓ vanjs-core: instancia única en el bundle (${((copies[0]?.[1].bytes ?? 0) / 1024).toFixed(1)}KB)`,
);
