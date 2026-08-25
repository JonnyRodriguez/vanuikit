import van from "vanjs-core";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeOptions {
  storageKey?: string;
  defaultMode?: ThemeMode;
  attribute?: string;
}

export interface ThemeInstance {
  mode: import("vanjs-core").State<ThemeMode>;
  isDark: import("vanjs-core").State<boolean>;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

/**
 * Gestor reactivo de tema (Claro / Oscuro / Sistema) para VanJS.
 * Sincroniza la clase `.dark` en el elemento <html> y persiste la preferencia.
 */
export function createTheme(options: ThemeOptions = {}): ThemeInstance {
  const storageKey = options.storageKey ?? "vanui-theme";
  const defaultMode = options.defaultMode ?? "system";

  const getSavedMode = (): ThemeMode => {
    if (typeof window === "undefined" || !window.localStorage) return defaultMode;
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
    return defaultMode;
  };

  const mode = van.state<ThemeMode>(getSavedMode());
  const isSystemDark = van.state(
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  if (typeof window !== "undefined" && window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      isSystemDark.val = e.matches;
      applyTheme();
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else if ("addListener" in mediaQuery) {
      (mediaQuery as any).addListener(handler);
    }
  }

  const isDark = van.derive(() => {
    if (mode.val === "system") {
      return isSystemDark.val;
    }
    return mode.val === "dark";
  });

  const applyTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const darkActive = mode.val === "system" ? isSystemDark.val : mode.val === "dark";
    if (darkActive) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  };

  // Aplicar inmediatamente al crear
  applyTheme();

  const setMode = (newMode: ThemeMode) => {
    mode.val = newMode;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(storageKey, newMode);
    }
    applyTheme();
  };

  const toggle = () => {
    const currentDark = mode.val === "system" ? isSystemDark.val : mode.val === "dark";
    setMode(currentDark ? "light" : "dark");
  };

  return {
    mode,
    isDark,
    setMode,
    toggle,
  };
}
