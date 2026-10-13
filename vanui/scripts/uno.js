/**
 * Genera el CSS estático de la librería vanui, sin el runtime del CDN.
 *
 * Escanea los fuentes del paquete (vanui/src), extrae las clases de sus
 * componentes y las compila con @unocss/preset-uno -> dist/vanui.css
 *
 * Uso: node scripts/uno.js  (o npm run css, que lo invoca)
 *
 * Dependencias (dev): @unocss/core y @unocss/preset-uno
 *
 * Tema: los colores, radios y sombras se resuelven con variables CSS `--vui-*`
 * definidas en :root (ver VUI_THEME). El consumidor re-tematiza la librería
 * sobreescribiendo esas variables en su propio CSS (cargado después de este).
 */

/** Reset mínimo (reemplaza el preflight que el preset trae por defecto y
 *  que el `preflights` propio del generador elimina). Sin `border-style:
 *  solid` los bordes con ancho (border-t-2, border-border…) se computan a
 *  0px y no se pintan — p. ej. el anillo del Spin quedaba invisible. El
 *  reset de <button> evita el gris nativo del navegador (#efefef) en botones
 *  sin clase de fondo propia, que en modo oscuro destapa un botón claro. */
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
`.trim();

/** Variables del tema por defecto (mismos valores que las clases originales). */
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
--vui-card:color-mix(in srgb, #ffffff 5%, var(--vui-background));
--vui-shadow-sm:0 1px 2px 0 rgb(0 0 0 / .3);
--vui-shadow-lg:0 10px 15px -3px rgb(0 0 0 / .5),0 4px 6px -4px rgb(0 0 0 / .5);
--vui-shadow-xl:0 20px 25px -5px rgb(0 0 0 / .5),0 8px 10px -6px rgb(0 0 0 / .5);
--vui-shadow-2xl:0 25px 50px -12px rgb(0 0 0 / .7);
}
`.trim();

/** Envuelve un color (var --vui-*) en color-mix con el placeholder %alpha:
 *  así los modificadores de opacidad (bg-secondary/60, text-muted-foreground/70)
 *  resuelven de verdad en vez de descartarse en silencio. */
const cm = (v) => `color-mix(in srgb, ${v} calc(%alpha * 100%), transparent)`;

/** Mapea las clases de color/radio/sombra a las variables del tema. */
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

import fs from "node:fs";
import path from "node:path";
import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";

const OUT = "dist/vanui.css";

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

// El extractor de UnoCSS toma los tokens de clases de cualquier texto;
// concatenamos todo el código fuente.
const source = files.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

const generator = await createGenerator({
  // El theme va a nivel del generador, no dentro del preset: así las clases
  // de color custom, borderRadius y boxShadow resuelven a var(--vui-*).
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
const { css } = await generator.generate(source, { id: "vanui" });

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, css, "utf-8");
console.log(
  `vanui.css generado (${files.length} archivos escaneados, ${css.length} bytes)`,
);

