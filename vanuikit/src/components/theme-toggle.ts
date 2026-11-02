import van from "vanjs-core";
import { createTheme, type ThemeInstance, type ThemeMode } from "../theme.js";
import { i18n as defaultI18n, type I18nInstance } from "../i18n.js";
import { cx } from "../util.js";
import { Icon, type IconName } from "./icon.js";

/** Contrato de llaves de i18n del componente */
export const TEXTS = {
  light: { key: "theme.light", default: "Claro" },
  dark: { key: "theme.dark", default: "Oscuro" },
  system: { key: "theme.system", default: "Sistema" },
  selectLabel: { key: "theme.selectLabel", default: "Seleccionar tema visual" },
  toggleLabel: { key: "theme.toggleLabel", default: "Alternar tema visual (Claro / Oscuro / Sistema)" },
  toggleTitle: { key: "theme.toggleTitle", default: "Alternar tema (Claro / Oscuro / Sistema)" },
} as const;

// Instancia singleton por defecto para aplicaciones que no pasen una instancia personalizada
let defaultThemeInstance: ThemeInstance | null = null;
function getDefaultTheme(): ThemeInstance {
  if (!defaultThemeInstance) {
    defaultThemeInstance = createTheme();
  }
  return defaultThemeInstance;
}

export interface ThemeToggleProps {
  theme?: ThemeInstance;
  i18n?: I18nInstance;
  /** Variante visual: "button" (un solo botón cíclico), "segmented" (botones para cada modo) */
  variant?: "button" | "segmented";
  /** Mostrar u ocultar texto explicativo junto al ícono */
  showLabel?: boolean;
  /** Clases CSS adicionales */
  class?: string;
  /** Soporta tema del sistema en el ciclo */
  includeSystem?: boolean;
}

/**
 * Componente nativo y autocontenido para alternar el tema visual (Claro / Oscuro / Sistema).
 * Embebido directamente en VanUikit para máxima focalización y cero boilerplate en las aplicaciones.
 */
export function ThemeToggle(props: ThemeToggleProps = {}) {
  const { button, div, span } = van.tags;
  const theme = props.theme ?? getDefaultTheme();
  const i18n = props.i18n ?? defaultI18n;
  const variant = props.variant ?? "button";
  const showLabel = props.showLabel ?? false;
  const includeSystem = props.includeSystem ?? true;

  if (variant === "segmented") {
    const modes: { mode: ThemeMode; icon: IconName; text: { key: string; default: string } }[] = includeSystem
      ? [
          { mode: "light", icon: "sun", text: TEXTS.light },
          { mode: "dark", icon: "moon", text: TEXTS.dark },
          { mode: "system", icon: "monitor", text: TEXTS.system },
        ]
      : [
          { mode: "light", icon: "sun", text: TEXTS.light },
          { mode: "dark", icon: "moon", text: TEXTS.dark },
        ];

    return div(
      {
        class: cx(
          "inline-flex items-center p-1 rounded-xl bg-secondary/60 border border-border/80 gap-1",
          props.class,
        ),
        role: "radiogroup",
        "aria-label": i18n.t("theme.selectLabel", "Seleccionar tema visual"),
      },
      modes.map(({ mode, icon, text }) => {
        const isActive = van.derive(() => theme.mode.val === mode);
        return button(
          {
            type: "button",
            role: "radio",
            "aria-checked": isActive,
            // Nombre accesible: el ícono es puramente visual; sin esto un
            // lector de pantalla anuncia "radio button" sin decir cuál modo es.
            "aria-label": i18n.t(text.key, text.default),
            class: () =>
              cx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer select-none",
                isActive.val
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent",
              ),
            onclick: () => theme.setMode(mode),
          },
          Icon({ name: icon }),
          showLabel ? span(i18n.t(text.key, text.default)) : null,
        );
      }),
    );
  }

  // Variante "button" (ciclo rápido con un clic)
  const cycle = () => {
    if (includeSystem) {
      if (theme.mode.val === "system") theme.setMode("dark");
      else if (theme.mode.val === "dark") theme.setMode("light");
      else theme.setMode("system");
    } else {
      theme.setMode(theme.mode.val === "dark" ? "light" : "dark");
    }
  };

  const getIcon = (): IconName => {
    if (theme.mode.val === "system") return "monitor";
    return theme.mode.val === "dark" ? "moon" : "sun";
  };

  const getLabel = () => {
    if (theme.mode.val === "system") return i18n.t("theme.system", "Sistema");
    return theme.mode.val === "dark"
      ? i18n.t("theme.dark", "Oscuro")
      : i18n.t("theme.light", "Claro");
  };

  return button(
    {
      type: "button",
      class: cx(
        "inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium cursor-pointer transition-colors shadow-xs select-none",
        props.class,
      ),
      "aria-label": i18n.t("theme.toggleLabel", "Alternar tema visual (Claro / Oscuro / Sistema)"),
      title: i18n.t("theme.toggleTitle", "Alternar tema (Claro / Oscuro / Sistema)"),
      onclick: cycle,
    },
    () => Icon({ name: getIcon() }),
    showLabel ? () => span(getLabel()) : null,
  );
}
