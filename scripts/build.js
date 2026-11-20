import { execSync } from "node:child_process";

function run(cmd, label, cwd) {
  console.log(`==> ${label}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

// The root is a workspace (vanuikit + demo): node_modules is linked with bun/npm
// install and each package has its own pipeline. This only orchestrates the order.

// [1/4] Library typecheck
run("npm run typecheck", "[1/4] Typecheck vanuikit...", "vanuikit");

// [2/4] Library build: css + bundles (client and server) + .d.ts types
run("npm run build", "[2/4] Build vanuikit (css, bundles, types)...", "vanuikit");

// [3/4] Demo typecheck (resolves vanuikit from node_modules, like a real consumer)
run("npm run typecheck", "[3/4] Typecheck demo...", "demo");

// [4/4] Demo build: client bundle + styles
run("npm run build", "[4/4] Build demo (bundle, styles)...", "demo");

console.log("✅ Build completed successfully.");
