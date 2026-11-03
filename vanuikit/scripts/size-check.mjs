// scripts/size-check.mjs
// Size budget for the published client core (dist/). Builds src/index.ts
// minified with vanjs-core external (peer dep) and fails if the gzipped
// output exceeds GZIP_LIMIT. Run with: bun run size
import esbuild from "esbuild";
import { gzipSync } from "node:zlib";

const GZIP_LIMIT = 45 * 1024; // 45 kB gzip

const result = await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  minify: true,
  external: ["vanjs-core"],
  write: false,
});

const out = result.outputFiles[0].contents;
const gz = gzipSync(out).length;
const rawKb = (out.length / 1024).toFixed(1);
const gzKb = (gz / 1024).toFixed(1);

console.log(`vanuikit core (minified, external vanjs-core): ${rawKb} kB raw, ${gzKb} kB gzip`);

if (gz > GZIP_LIMIT) {
  console.error(`❌ gzip ${gz} B exceeds limit ${GZIP_LIMIT} B`);
  process.exit(1);
}
console.log(`✅ under gzip limit (${GZIP_LIMIT} B)`);
