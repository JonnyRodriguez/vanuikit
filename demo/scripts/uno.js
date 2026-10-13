/**
 * Estilos de la demo — consumidor puro de vanui.
 *
 * - Compila con UnoCSS SOLO los fuentes de la demo (pages, components, server,
 *   index.html) a demo/dist/uno.css. Los estilos y el reset de la librería no
 *   se escanean: vienen en su hoja publicada (vanui/styles.css).
 * - Copia esa hoja del paquete instalado a demo/dist/vanui.css.
 *
 * Las utilidades que referencian el tema (--vui-*) se mapean con el mismo
 * THEME que usa la librería; las variables y el reset los define vanui.css,
 * que index.html carga antes que este archivo.
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
const OUT_VANUI = path.join(demoDir, "dist/vanui.css");

/** Envuelve un color (var --vui-*) en color-mix con el placeholder %alpha:
 *  así los modificadores de opacidad (bg-secondary/60, text-muted-foreground/70)
 *  resuelven de verdad en vez de descartarse en silencio. Debe espejar el THEME
 *  de vanui/scripts/uno.js. */
const cm = (v) => `color-mix(in srgb, ${v} calc(%alpha * 100%), transparent)`;

/** Mapea las clases de color/radio/sombra a las variables del tema --vui-* (definidas por vanui/styles.css). */
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
    // Brillo del botón primario (button.ts: shadow-primary-shadow)
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

const { css } = await generator.generate(source, { id: "vanui-demo" });

const demoCssPath = path.join(demoDir, "demo.css");
const demoCustomCss = fs.existsSync(demoCssPath) ? fs.readFileSync(demoCssPath, "utf-8") : "";
const finalDemoCss = `${css}\n\n/* demo.css */\n${demoCustomCss}`;

// Hoja publicada de la librería, resuelta desde node_modules (consumidor real).
const require = createRequire(import.meta.url);
let vanuiCssPath;
try {
  vanuiCssPath = require.resolve("vanui/styles.css");
} catch {
  // Fallback si el paquete no está enlazado aún (primer bootstrap del repo).
  vanuiCssPath = path.resolve(demoDir, "../vanui/dist/vanui.css");
}

fs.mkdirSync(path.dirname(OUT_UNO), { recursive: true });
fs.writeFileSync(OUT_UNO, finalDemoCss, "utf-8");
fs.copyFileSync(vanuiCssPath, OUT_VANUI);

console.log(
  `CSS demo generado (${files.length} archivos escaneados, ${finalDemoCss.length} bytes) + vanui.css copiado desde ${path.relative(demoDir, vanuiCssPath)}`,
);
