/**
 * Genera el CSS de utilidades de la demo con UnoCSS, sin el runtime del CDN.
 *
 * Escanea SOLO los archivos de la demo (pantallas, bundles y html), extrae
 * sus clases y las compila con @unocss/preset-uno -> dist/uno.css
 *
 * El CSS de la librería NO se genera aquí: viene compilado en el paquete
 * (vanui/dist/vanui.css) y el build lo copia a dist/. Este script cubre
 * únicamente lo que la demo estiliza por su cuenta.
 *
 * Uso: bun run uno  (o bun run build, que lo invoca)
 *
 * Dependencias (dev): @unocss/core y @unocss/preset-uno
 *
 * Tema: las clases de color/radio/sombra resuelven a variables `--vui-*`
 * (ver THEME). Las variables están definidas en vanui.css (el paquete),
 * que se carga antes que este archivo; el consumidor re-tematiza
 * sobreescribiéndolas en su propio CSS.
 */
import fs from "node:fs";
import path from "node:path";
import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";

const OUT = "dist/uno.css";

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

// Recolecta los archivos a escanear.
const files = [];

// Escanea archivos raíz de demo (.html, .ts)
for (const f of fs.readdirSync(".")) {
  if (f.endsWith(".html") || f.endsWith(".ts")) {
    files.push(f);
  }
}

// Escanea screens/
if (fs.existsSync("screens")) {
  for (const f of fs.readdirSync("screens")) {
    if (f.endsWith(".ts")) {
      files.push(path.join("screens", f));
    }
  }
}

// El extractor de UnoCSS toma los tokens de clases de cualquier texto;
// concatenamos todo el código fuente.
const source = files.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

const generator = await createGenerator({
  // El theme va a nivel del generador, no dentro del preset: así las clases
  // de color custom, borderRadius y boxShadow resuelven a var(--vui-*).
  theme: THEME,
  presets: [presetUno()],
  // Sin preflights: el reset y las variables --vui-* vienen de vanui.css.
  preflights: [],
});
const { css } = await generator.generate(source, { id: "vanui-demo" });

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, css, "utf-8");
console.log(
  `uno.css generado (${files.length} archivos escaneados, ${css.length} bytes)`,
);

