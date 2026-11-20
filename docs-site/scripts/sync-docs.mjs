/**
 * sync-docs — generate Starlight content from the canonical docs.
 *
 * The source of truth is `vanuikit/docs/` (it ships inside the npm package).
 * This script recreates `docs-site/src/content/docs/` from it on every dev/build,
 * so the portal can never serve a stale copy. It also:
 *
 *   - adds the frontmatter Starlight requires (title from the first H1),
 *   - maps `README.md` to `/` and uppercased names to lowercase slugs,
 *   - rewrites relative `*.md` links into clean Starlight routes.
 *
 * The generated directory is gitignored: never edit it by hand.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SRC = path.join(ROOT, "vanuikit", "docs");
const DEST = path.join(ROOT, "docs-site", "src", "content", "docs");

/** Canonical filename -> Starlight route filename. */
const SLUG_FILES = {
  "README.md": "index.md",
  "AI-GUIDE.md": "ai-guide.md",
  "DEBUG_REACTIVITY.md": "debug-reactivity.md",
};

/** Canonical link target (without .md) -> Starlight route. */
function routeFor(target) {
  const clean = target.replace(/^\.\.?\//, "").replace(/\.md$/, "");
  if (clean === "README") return "/";
  return `/${clean.toLowerCase().replace(/_/g, "-")}/`;
}

function starlightPage(source, filename) {
  let text = source.replace(/^\uFEFF/, "");

  // The canonical docs have no frontmatter. If one is ever added, preserve it.
  if (!text.startsWith("---\n")) {
    const heading = text.match(/^#\s+(.+)$/m)?.[1] ?? filename.replace(/\.md$/, "");
    const title = heading.replace(/`/g, "").trim();
    // Starlight renders the frontmatter title as the page H1, so drop the
    // source document's leading H1 from the body to avoid a duplicate heading.
    text = text.replace(/^#\s+.+\n+/, "");
    text = `---\ntitle: ${JSON.stringify(title)}\n---\n\n${text}`;
  }

  // `](./api/form-controls.md)` -> `](/api/form-controls/)`.
  text = text.replace(/\]\((\.{1,2}\/[^\s)]+)\)/g, (match, target) => {
    const hashIndex = target.indexOf("#");
    const file = hashIndex === -1 ? target : target.slice(0, hashIndex);
    const anchor = hashIndex === -1 ? "" : target.slice(hashIndex);
    if (!file.endsWith(".md")) return match;
    return `](${routeFor(file)}${anchor})`;
  });

  return text;
}

function collect(dir, base = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const rel = path.join(base, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full, rel));
    else if (entry.name.endsWith(".md")) out.push({ rel, full });
  }
  return out;
}

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

const files = collect(SRC);
for (const { rel, full } of files) {
  const outName = SLUG_FILES[rel] ?? rel;
  const outPath = path.join(DEST, outName);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, starlightPage(fs.readFileSync(full, "utf8"), path.basename(rel)));
}

console.log(`[docs:sync] ${files.length} Markdown files -> docs-site/src/content/docs`);
