/**
 * build-playground — compile the static component showcase and copy it into the
 * docs site output so it is served as /playground/ alongside the Starlight pages.
 *
 * Reuses the demo's ComponentsPage (client-only, no backend). Run after
 * `astro build` because the build clears docs-site/dist/.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const DEMO = path.join(ROOT, "demo");
const OUT = path.join(DEMO, "dist-playground");
const DEST = path.join(ROOT, "docs-site", "dist", "playground");

function run(cmd, cwd, opts = {}) {
  execSync(cmd, { stdio: "inherit", cwd, ...opts });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Library must be built first (types + styles consumed by the bundle/uno.js).
run("npm run build", path.join(ROOT, "vanuikit"));

// Bundle the standalone playground entry (no router, no backend).
const requireFromDemo = createRequire(path.join(DEMO, "package.json"));
const esbuild = await import(requireFromDemo.resolve("esbuild"));
const result = await esbuild.build({
  entryPoints: [path.join(DEMO, "playground.ts")],
  bundle: true,
  outdir: OUT,
  format: "esm",
  splitting: true,
  metafile: true,
  write: true,
});
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(result.metafile));
run("node scripts/check-single-vanjs.js dist-playground/meta.json", DEMO);

// Utilities + library stylesheet for the scanned demo sources.
run("node scripts/uno.js", DEMO, { env: { ...process.env, OUT_DIR: OUT } });

// Collect static assets for /playground/.
fs.copyFileSync(path.join(DEMO, "playground.html"), path.join(OUT, "index.html"));
fs.copyFileSync(path.join(DEMO, "favicon.svg"), path.join(OUT, "favicon.svg"));

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.cpSync(OUT, DEST, { recursive: true });

console.log(`[docs:playground] copied playground to docs-site/dist/playground`);

