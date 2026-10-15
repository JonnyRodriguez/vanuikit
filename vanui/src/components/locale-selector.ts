import van from "vanjs-core";
import { i18n as defaultI18n, type I18nInstance } from "../i18n.js";
import { cx } from "../util.js";

export interface LocaleOption {
  code: string;
  label: string;
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

const DEFAULT_FLAGS: Record<string, string> = {
  es: "🇪🇸",
  en: "🇺🇸",
  fr: "🇫🇷",
  pt: "🇧🇷",
  de: "🇩🇪",
  it: "🇮🇹",
};

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
      return {
        code,
        label,
        flag: DEFAULT_FLAGS[code] || "🌐",
      };
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
          flag ? span({ class: "text-xs leading-none" }, flag) : null,
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
    optionsList.map(({ code, label, flag }) =>
      option(
        {
          value: code,
          selected: () => i18n.currentLocale.val === code,
        },
        flag ? `${flag} ${label}` : label,
      ),
    ),
  );
}
