/**
 * Demo styles — a pure consumer of vanuikit.
 *
 * - Compiles with UnoCSS ONLY the demo sources (pages, components, server,
 *   index.html) to demo/dist/uno.css. The library's styles and reset are not
 *   scanned: they come from its published stylesheet (vanuikit/styles.css).
 * - Copies that stylesheet from the installed package to demo/dist/vanuikit.css.
 *
 * Utilities that reference the theme (--vui-*) are mapped using the same
 * THEME that the library uses; the variables and reset are defined by vanuikit.css,
 * which index.html loads before this file.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoDir = path.resolve(__dirname, "..");

const OUT_UNO = path.join(demoDir, "dist/uno.css");
const OUT_VANUIKIT = path.join(demoDir, "dist/vanuikit.css");

/** Wraps a color (var --vui-*) in color-mix with the %alpha placeholder:
 *  so opacity modifiers (bg-secondary/60, text-muted-foreground/70) actually
 *  resolve instead of being silently discarded. It must mirror the THEME
 *  in vanuikit/scripts/uno.js. */
const cm = (v) => `color-mix(in srgb, ${v} calc(%alpha * 100%), transparent)`;

/** Maps color/radius/shadow classes to the --vui-* theme variables (defined by vanuikit/styles.css). */
const THEME = {
  colors: {
    primary: cm("var(--vui-primary)"),
    "primary-hover": cm("var(--vui-primary-hover)"),
    "primary-active": cm("var(--vui-primary-active)"),
    "primary-fg": cm("var(--vui-primary-fg)"),
    secondary: cm("var(--vui-secondary)"),
    "secondary-hover": cm("var(--vui-secondary-hover)"),
    "secondary-active": cm("var(--vui-secondary-active)"),
    "secondary-fg": cm("var(--vui-secondary-fg)"),
    accent: cm("var(--vui-accent)"),
    "accent-hover": cm("var(--vui-accent-hover)"),
    focus: cm("var(--vui-focus)"),
    background: cm("var(--vui-background)"),
    card: cm("var(--vui-card)"),
    surface: cm("var(--vui-card)"),
    foreground: cm("var(--vui-foreground)"),
    "foreground-soft": cm("var(--vui-foreground-soft)"),
    muted: cm("var(--vui-muted)"),
    "muted-foreground": cm("var(--vui-muted)"),
    border: cm("var(--vui-border)"),
    overlay: cm("var(--vui-overlay)"),
    destructive: cm("var(--vui-destructive)"),
  },
  borderRadius: {
    md: "var(--vui-radius-md)",
    lg: "var(--vui-radius-lg)",
    "2xl": "var(--vui-radius-2xl)",
    full: "var(--vui-radius-full)",
  },
  boxShadow: {
    sm: "var(--vui-shadow-sm)",
    lg: "var(--vui-shadow-lg)",
    xl: "var(--vui-shadow-xl)",
    "2xl": "var(--vui-shadow-2xl)",
    // Primary button glow (button.ts: shadow-primary-shadow)
    "primary-shadow": "var(--un-shadow-inset) 0 4px 14px 0 var(--vui-primary-shadow)",
  },
};

function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "dist") {
      files.push(...getFiles(res));
    } else if (entry.isFile() && (res.endsWith(".ts") || res.endsWith(".html") || res.endsWith(".js"))) {
      files.push(res);
    }
  }
  return files;
}

const files = getFiles(demoDir);
const source = files.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

const generator = await createGenerator({
  theme: THEME,
  presets: [presetUno()],
});

const { css } = await generator.generate(source, { id: "vanuikit-demo" });

const demoCssPath = path.join(demoDir, "demo.css");
const demoCustomCss = fs.existsSync(demoCssPath) ? fs.readFileSync(demoCssPath, "utf-8") : "";
const finalDemoCss = `${css}\n\n/* demo.css */\n${demoCustomCss}`;

// Library's published stylesheet, resolved from node_modules (real consumer).
const require = createRequire(import.meta.url);
let vanuikitCssPath;
try {
  vanuikitCssPath = require.resolve("vanuikit/styles.css");
} catch {
  // Fallback if the package is not linked yet (first repo bootstrap).
  vanuikitCssPath = path.resolve(demoDir, "../vanuikit/dist/vanuikit.css");
}

fs.mkdirSync(path.dirname(OUT_UNO), { recursive: true });
fs.writeFileSync(OUT_UNO, finalDemoCss, "utf-8");
fs.copyFileSync(vanuikitCssPath, OUT_VANUIKIT);

console.log(
  `demo CSS generated (${files.length} files scanned, ${finalDemoCss.length} bytes) + vanuikit.css copied from ${path.relative(demoDir, vanuikitCssPath)}`,
);
