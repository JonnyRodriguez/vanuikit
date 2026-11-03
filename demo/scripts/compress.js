/**
 * Precompresses the assets in demo/dist into .gz and .br so that Hono's serveStatic
 * (precompressed: true option) serves them based on Accept-Encoding.
 *
 * Usage: node scripts/compress.js  (invoked at the end of build:client)
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const COMPRESSIBLE = /\.(js|css|svg|html|json|map)$/;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(res, files);
    else if (COMPRESSIBLE.test(res) && !res.endsWith(".map")) files.push(res);
  }
  return files;
}

let savedOriginal = 0;
let savedCompressed = 0;
const files = walk(distDir);
for (const file of files) {
  const data = fs.readFileSync(file);
  const gz = zlib.gzipSync(data, { level: 9 });
  const br = zlib.brotliCompressSync(data, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  fs.writeFileSync(file + ".gz", gz);
  fs.writeFileSync(file + ".br", br);
  savedOriginal += data.length;
  savedCompressed += Math.min(gz.length, br.length);
}

console.log(
  `Precomprimidos ${files.length} assets (.gz + .br): ` +
    `${(savedOriginal / 1024).toFixed(0)}KB -> ${(savedCompressed / 1024).toFixed(0)}KB en el peor caso (gzip)`,
);
