/**
 * Genera el CSS de utilidades de la demo con UnoCSS.
 *
 * Escanea archivos de demo/ y vanui/src/, extrae sus clases y las compila
 * a demo/dist/uno.css y demo/dist/vanui.css
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const demoDir = path.resolve(__dirname, "..");
const vanuiDir = path.resolve(rootDir, "vanui");

const OUT_DEMO = path.join(demoDir, "dist/uno.css");
const OUT_VANUI = path.join(demoDir, "dist/vanui.css");
const OUT_VANUI_PKG = path.join(vanuiDir, "dist/vanui.css");

const RESET = `
*, *::before, *::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: currentColor;
}
`.trim();

const VUI_THEME = `
:root{
--vui-primary:#22c55e;
--vui-primary-hover:#16a34a;
--vui-primary-active:#15803d;
--vui-primary-fg:#ffffff;
--vui-primary-shadow:rgb(34 197 94 / .5);
--vui-secondary:#d1d5db;
--vui-secondary-hover:#9ca3af;
--vui-secondary-active:#6b7280;
--vui-secondary-fg:#1f2937;
--vui-accent:#2563eb;
--vui-accent-hover:#1d4ed8;
--vui-focus:#3b82f6;
--vui-background:#ffffff;
--vui-foreground:#111827;
--vui-foreground-soft:#374151;
--vui-muted:#6b7280;
--vui-border:#d1d5db;
--vui-overlay:rgb(0 0 0 / .5);
--vui-destructive:#dc2626;
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
--vui-primary:#22c55e;
--vui-primary-hover:#16a34a;
--vui-primary-active:#15803d;
--vui-primary-fg:#ffffff;
--vui-primary-shadow:rgb(34 197 94 / .3);
--vui-secondary:#374151;
--vui-secondary-hover:#4b5563;
--vui-secondary-active:#6b7280;
--vui-secondary-fg:#f9fafb;
--vui-accent:#3b82f6;
--vui-accent-hover:#60a5fa;
--vui-focus:#60a5fa;
--vui-background:#1f2937;
--vui-foreground:#f9fafb;
--vui-foreground-soft:#e5e7eb;
--vui-muted:#9ca3af;
--vui-border:#374151;
--vui-overlay:rgb(0 0 0 / .75);
--vui-destructive:#ef4444;
--vui-shadow-sm:0 1px 2px 0 rgb(0 0 0 / .3);
--vui-shadow-lg:0 10px 15px -3px rgb(0 0 0 / .5),0 4px 6px -4px rgb(0 0 0 / .5);
--vui-shadow-xl:0 20px 25px -5px rgb(0 0 0 / .5),0 8px 10px -6px rgb(0 0 0 / .5);
--vui-shadow-2xl:0 25px 50px -12px rgb(0 0 0 / .7);
}
`.trim();

/** Mapea las clases de color/radio/sombra a las variables del tema (vanui.css). */
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

const demoFiles = getFiles(demoDir);
const vanuiFiles = getFiles(path.join(vanuiDir, "src"));
const allFiles = [...demoFiles, ...vanuiFiles];

const source = allFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

const generator = await createGenerator({
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

const { css } = await generator.generate(source, { id: "vanui-demo" });

const demoCssPath = path.join(demoDir, "demo.css");
const demoCustomCss = fs.existsSync(demoCssPath) ? fs.readFileSync(demoCssPath, "utf-8") : "";
const finalDemoCss = `${css}\n\n/* demo.css */\n${demoCustomCss}`;

fs.mkdirSync(path.dirname(OUT_DEMO), { recursive: true });
fs.writeFileSync(OUT_DEMO, finalDemoCss, "utf-8");
fs.writeFileSync(OUT_VANUI, finalDemoCss, "utf-8");
fs.mkdirSync(path.dirname(OUT_VANUI_PKG), { recursive: true });
fs.writeFileSync(OUT_VANUI_PKG, css, "utf-8");

console.log(
  `CSS generado exitosamente (${allFiles.length} archivos escaneados, ${finalDemoCss.length} bytes)`,
);
