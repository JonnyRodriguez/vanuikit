import van from "vanjs-core";
import { i18n as defaultI18n, type I18nInstance } from "../i18n.js";
import { cx } from "../util.js";
import { Icon } from "./icon.js";

export interface LocaleOption {
  code: string;
  label: string;
  /** Deprecated: el flag ahora se deriva del código con SVG multicolor. */
  flag?: string;
}

export interface LocaleSelectorProps {
  i18n?: I18nInstance;
  /** Lista personalizada de opciones o autodetectada desde los diccionarios cargados */
  options?: LocaleOption[];
  /** Variante visual: "select" (dropdown nativo estilizado) o "buttons" (pastillas de selección) */
  variant?: "select" | "buttons";
  /** Clases CSS adicionales */
  class?: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const { svg, rect, circle } = van.tags(SVG_NS);

type RectShape = { x: number; y: number; width: number; height: number; fill: string };
type CircleShape = { cx: number; cy: number; r: number; fill: string };
type Shape = RectShape | CircleShape;

/** Banderas simplificadas (SVG multicolor, 24×16): contenido, no iconografía. */
const FLAG_SHAPES: Record<string, Shape[]> = {
  es: [
    { x: 0, y: 0, width: 24, height: 5, fill: "#aa151b" },
    { x: 0, y: 5, width: 24, height: 6, fill: "#f1bf00" },
    { x: 0, y: 11, width: 24, height: 5, fill: "#aa151b" },
  ],
  fr: [
    { x: 0, y: 0, width: 8, height: 16, fill: "#0055a4" },
    { x: 8, y: 0, width: 8, height: 16, fill: "#ffffff" },
    { x: 16, y: 0, width: 8, height: 16, fill: "#ef4135" },
  ],
  de: [
    { x: 0, y: 0, width: 24, height: 5.3, fill: "#000000" },
    { x: 0, y: 5.3, width: 24, height: 5.3, fill: "#dd0000" },
    { x: 0, y: 10.7, width: 24, height: 5.3, fill: "#ffce00" },
  ],
  it: [
    { x: 0, y: 0, width: 8, height: 16, fill: "#009246" },
    { x: 8, y: 0, width: 8, height: 16, fill: "#ffffff" },
    { x: 16, y: 0, width: 8, height: 16, fill: "#ce2b37" },
  ],
  pt: [
    { x: 0, y: 0, width: 24, height: 16, fill: "#009c3b" },
    { cx: 12, cy: 8, r: 6, fill: "#ffdf00" },
    { cx: 12, cy: 8, r: 3.5, fill: "#002776" },
  ],
  en: [
    { x: 0, y: 0, width: 24, height: 16, fill: "#ffffff" },
    { x: 0, y: 0, width: 24, height: 3.2, fill: "#b22234" },
    { x: 0, y: 6.4, width: 24, height: 3.2, fill: "#b22234" },
    { x: 0, y: 12.8, width: 24, height: 3.2, fill: "#b22234" },
    { x: 0, y: 0, width: 10, height: 8.6, fill: "#3c3b6e" },
  ],
};

/** Bandera SVG por código; fallback globe para códigos desconocidos. */
function FlagIcon({ code }: { code: string }) {
  const shapes = FLAG_SHAPES[code];
  if (!shapes) return Icon({ name: "globe", class: "size-4" });
  return svg(
    {
      viewBox: "0 0 24 16",
      class: "size-4 shrink-0 rounded-[2px] select-none",
      "aria-hidden": "true",
    },
    ...shapes.map((s) =>
      "r" in s
        ? circle({ cx: s.cx, cy: s.cy, r: s.r, fill: s.fill })
        : rect({ x: s.x, y: s.y, width: s.width, height: s.height, fill: s.fill }),
    ),
  );
}

/**
 * Componente nativo y autocontenido para cambiar de idioma / locale.
 * Embebido directamente en VanUI para máxima focalización y cero boilerplate en las aplicaciones.
 */
export function LocaleSelector(props: LocaleSelectorProps = {}) {
  const { select, option, div, button, span } = van.tags;
  const i18n = props.i18n ?? defaultI18n;
  const variant = props.variant ?? "select";

  const getOptions = (): LocaleOption[] => {
    if (props.options && props.options.length > 0) {
      return props.options;
    }
    if (!i18n.locales) return [];
    return Object.keys(i18n.locales).map((code) => {
      const label =
        i18n.locales[code]?.lang?.[code] ||
        i18n.locales["es"]?.lang?.[code] ||
        code.toUpperCase();
      return { code, label };
    });
  };

  const optionsList = getOptions();

  if (variant === "buttons") {
    return div(
      {
        class: cx(
          "inline-flex items-center p-1 rounded-xl bg-secondary/60 border border-border/80 gap-1",
          props.class,
        ),
        role: "group",
        "aria-label": i18n.t("locale.groupLabel", "Selector de idioma"),
      },
      optionsList.map(({ code, label, flag }) => {
        const isActive = van.derive(() => i18n.currentLocale.val === code);
        return button(
          {
            type: "button",
            class: () =>
              cx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer select-none",
                isActive.val
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent",
              ),
            onclick: () => i18n.setLocale(code),
          },
          FlagIcon({ code }),
          span(label),
        );
      }),
    );
  }

  // Variante "select" por defecto
  return select(
    {
      class: cx(
        "text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground font-medium cursor-pointer transition-colors shadow-xs outline-none select-none hover:bg-secondary/50",
        props.class,
      ),
      "aria-label": i18n.t("locale.selectLabel", "Idioma / Language"),
      onchange: (e: Event) => i18n.setLocale((e.target as HTMLSelectElement).value),
      value: () => i18n.currentLocale.val,
    },
    optionsList.map(({ code, label }) =>
      option(
        {
          value: code,
          selected: () => i18n.currentLocale.val === code,
        },
        label,
      ),
    ),
  );
}
