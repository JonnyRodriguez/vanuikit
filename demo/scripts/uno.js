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

/** Mapea las clases de color/radio/sombra a las variables del tema --vui-* (definidas por vanui/styles.css). */
const THEME = {
  colors: {
    primary: "var(--vui-primary)",
    "primary-hover": "var(--vui-primary-hover)",
    "primary-active": "var(--vui-primary-active)",
    "primary-fg": "var(--vui-primary-fg)",
    "primary-shadow": "var(--vui-primary-shadow)",
    secondary: "var(--vui-secondary)",
    "secondary-hover": "var(--vui-secondary-hover)",
    "secondary-active": "var(--vui-secondary-active)",
    "secondary-fg": "var(--vui-secondary-fg)",
    accent: "var(--vui-accent)",
    "accent-hover": "var(--vui-accent-hover)",
    focus: "var(--vui-focus)",
    background: "var(--vui-background)",
    foreground: "var(--vui-foreground)",
    "foreground-soft": "var(--vui-foreground-soft)",
    muted: "var(--vui-muted)",
    border: "var(--vui-border)",
    overlay: "var(--vui-overlay)",
    destructive: "var(--vui-destructive)",
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
