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
import path from "node:path";
import { fileURLToPath } from "node:url";

const arg = process.argv[2];
const metaFile = arg
  ? path.resolve(arg)
  : fileURLToPath(new URL("../dist/meta.json", import.meta.url));
const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
const copies = Object.entries(meta.inputs).filter(([p]) => p.includes("vanjs-core"));

fs.rmSync(metaFile, { force: true });

if (copies.length > 1) {
  console.error(`❌ The bundle contains ${copies.length} copies of vanjs-core (must be exactly 1):`);
  for (const [p, i] of copies) console.error(`   ${((i.bytes ?? 0) / 1024).toFixed(1)}KB ${p}`);
  console.error("Hint: divergent versions between the app's package.json and vanuikit, or a direct import of vanjs-core (use `van` from vanuikit).");
  process.exit(1);
}

console.log(
  `✓ vanjs-core: single instance in the bundle (${((copies[0]?.[1].bytes ?? 0) / 1024).toFixed(1)}KB)`,
);
