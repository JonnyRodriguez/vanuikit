/**
 * Generates the static CSS of the vanuikit library, without the CDN runtime.
 *
 * Scans the package sources (vanuikit/src), extracts the classes of its
 * components and compiles them with @unocss/preset-uno -> dist/vanuikit.css
 *
 * Usage: node scripts/uno.js  (or npm run css, which invokes it)
 *
 * Dependencies (dev): @unocss/core and @unocss/preset-uno
 *
 * Theme: colors, radii and shadows resolve with CSS variables `--vui-*`
 * defined in :root (see VUI_THEME). The consumer re-themes the library
 * by overriding those variables in their own CSS (loaded after this one).
 */

/** Minimal reset (replaces the preflight the preset ships by default and
 *  that the generator's own `preflights` removes). Without `border-style:
 *  solid`, borders with width (border-t-2, border-border…) compute to
 *  0px and are not painted — e.g. the Spin ring used to be invisible. The
 *  <button> reset avoids the browser's native gray (#efefef) on buttons
 *  without their own background class, which in dark mode reveals a light button. */
const RESET = `
*, *::before, *::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: currentColor;
}
button {
  appearance: none;
  background-color: transparent;
  background-image: none;
  font: inherit;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
`.trim();

/** Default theme variables (same values as the original classes).
 *  Palette aligned to Tailwind CSS (the reference of shadcn and modern kits):
 *  primary/accent = blue-600 family (accent accompanies the primary: it is the
 *  selection/focus/progress color in Switch, Radio, Wizard, Progress, Nav, fields);
 *  neutrals = gray; destructive = red-600/500; focus ring = blue-500/400.
 *  States (info/success/warning) = 600 in light / 400 in dark (bases for
 *  solid backgrounds, dots and 10% tints) with their -fg at the level readable as
 *  text on tint (700 in light / 300 in dark, ≥ 4.5:1). */
const VUI_THEME = `
:root{
--vui-primary:#2563eb;
--vui-primary-hover:#1d4ed8;
--vui-primary-active:#1e40af;
--vui-primary-fg:#ffffff;
--vui-primary-shadow:rgb(37 99 235 / .5);
--vui-secondary:#e5e7eb;
--vui-secondary-hover:#d1d5db;
--vui-secondary-active:#9ca3af;
--vui-secondary-fg:#1f2937;
--vui-accent:#2563eb;
--vui-accent-hover:#1d4ed8;
--vui-accent-fg:#1d4ed8;
--vui-focus:#3b82f6;
--vui-background:#ffffff;
--vui-foreground:#111827;
--vui-foreground-soft:#374151;
--vui-muted:#6b7280;
--vui-border:#e5e7eb;
--vui-overlay:rgb(0 0 0 / .5);
--vui-destructive:#dc2626;
--vui-destructive-fg:#b91c1c;
--vui-info:#2563eb;
--vui-info-fg:#1d4ed8;
--vui-success:#16a34a;
--vui-success-fg:#15803d;
--vui-warning:#d97706;
--vui-warning-fg:#b45309;
--vui-card:#ffffff;
--vui-radius-md:0.375rem;
--vui-radius-lg:0.5rem;
--vui-radius-2xl:1rem;
--vui-radius-full:9999px;
--vui-shadow-sm:0 1px 2px 0 rgb(0 0 0 / .05);
--vui-shadow-lg:0 10px 15px -3px rgb(0 0 0 / .1),0 4px 6px -4px rgb(0 0 0 / .1);
--vui-shadow-xl:0 20px 25px -5px rgb(0 0 0 / .1),0 8px 10px -6px rgb(0 0 0 / .1);
--vui-shadow-2xl:0 25px 50px -12px rgb(0 0 0 / .25);
}

:root.dark, [data-theme="dark"]{
--vui-primary:#3b82f6;
--vui-primary-hover:#2563eb;
--vui-primary-active:#1d4ed8;
--vui-primary-fg:#ffffff;
--vui-primary-shadow:rgb(59 130 246 / .3);
--vui-secondary:#374151;
--vui-secondary-hover:#4b5563;
--vui-secondary-active:#6b7280;
--vui-secondary-fg:#f9fafb;
--vui-accent:#3b82f6;
--vui-accent-hover:#60a5fa;
--vui-accent-fg:#93c5fd;
--vui-focus:#60a5fa;
--vui-background:#111827;
--vui-foreground:#f9fafb;
--vui-foreground-soft:#e5e7eb;
--vui-muted:#9ca3af;
--vui-border:#374151;
--vui-overlay:rgb(0 0 0 / .75);
--vui-destructive:#ef4444;
--vui-destructive-fg:#fca5a5;
--vui-info:#60a5fa;
--vui-info-fg:#93c5fd;
--vui-success:#4ade80;
--vui-success-fg:#86efac;
--vui-warning:#fbbf24;
--vui-warning-fg:#fcd34d;
--vui-card:color-mix(in srgb, #ffffff 5%, var(--vui-background));
--vui-shadow-sm:0 1px 2px 0 rgb(0 0 0 / .3);
--vui-shadow-lg:0 10px 15px -3px rgb(0 0 0 / .5),0 4px 6px -4px rgb(0 0 0 / .5);
--vui-shadow-xl:0 20px 25px -5px rgb(0 0 0 / .5),0 8px 10px -6px rgb(0 0 0 / .5);
--vui-shadow-2xl:0 25px 50px -12px rgb(0 0 0 / .7);
}
`.trim();

/** Wraps a color (var --vui-*) in color-mix with the %alpha placeholder:
 *  this way opacity modifiers (bg-secondary/60, text-muted-foreground/70)
 *  actually resolve instead of being silently discarded. */
const cm = (v) => `color-mix(in srgb, ${v} calc(%alpha * 100%), transparent)`;

/** Maps the color/radius/shadow classes to the theme variables. */
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
    "accent-fg": cm("var(--vui-accent-fg)"),
    focus: cm("var(--vui-focus)"),
    info: cm("var(--vui-info)"),
    "info-fg": cm("var(--vui-info-fg)"),
    success: cm("var(--vui-success)"),
    "success-fg": cm("var(--vui-success-fg)"),
    warning: cm("var(--vui-warning)"),
    "warning-fg": cm("var(--vui-warning-fg)"),
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
    "destructive-fg": cm("var(--vui-destructive-fg)"),
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

import fs from "node:fs";
import path from "node:path";
import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";

const OUT = "dist/vanuikit.css";

function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(res));
    } else if (entry.isFile() && res.endsWith(".ts")) {
      files.push(res);
    }
  }
  return files;
}

const files = getFiles("src");

// The UnoCSS extractor takes class tokens from any text;
// we concatenate the whole source code.
const source = files.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

const generator = await createGenerator({
  // The theme goes at the generator level, not inside the preset: this way
  // custom color classes, borderRadius and boxShadow resolve to var(--vui-*).
  theme: THEME,
  presets: [presetUno()],
  preflights: [
    {
      layer: "preflights",
      getCSS: () => RESET,
    },
    {
      layer: "preflights",
      getCSS: () => VUI_THEME,
    },
  ],
});
const { css } = await generator.generate(source, { id: "vanuikit", minify: true });

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, css, "utf-8");
console.log(
  `vanuikit.css generated (${files.length} files scanned, ${css.length} bytes)`,
);

