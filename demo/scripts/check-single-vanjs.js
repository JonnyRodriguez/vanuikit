/**
 * Single-instance verification of VanJS in the demo bundle.
 *
 * Two copies of vanjs-core = two state systems that don't talk to each other:
 * reactivity breaks silently. The esbuild metafile says exactly how many
 * vanjs-core inputs were included; if it's more than one, the build fails.
 *
 * Usage: node scripts/check-single-vanjs.js (requires --metafile=dist/meta.json
 * on the esbuild command that runs before it).
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
