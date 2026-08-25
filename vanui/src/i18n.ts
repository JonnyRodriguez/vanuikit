import van from "vanjs-core";

export interface I18nOptions<T extends Record<string, any> = Record<string, any>> {
  defaultLocale: string;
  locales: Record<string, T>;
  storageKey?: string;
}

export interface I18nInstance<T extends Record<string, any> = Record<string, any>> {
  currentLocale: import("vanjs-core").State<string>;
  locales: Record<string, T>;
  setLocale: (locale: string) => void;
  getLocale: () => string;
  /**
   * Retorna una derivación reactiva (State<string>) con el texto traducido.
   * Al insertarlo en el DOM de VanJS, se actualiza automáticamente cuando cambia el idioma.
   */
  t: (key: string, params?: Record<string, string | number>) => import("vanjs-core").State<string>;
  /**
   * Retorna el texto traducido como string estático (no reactivo).
   */
  raw: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * Resuelve una llave anidada como "auth.login.submit" dentro de un diccionario.
 */
function resolveKey(dict: Record<string, any> | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  const parts = key.split(".");
  let current: any = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Reemplaza variables en una cadena: "Hola {name}" -> "Hola Mundo"
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    return params[k] !== undefined ? String(params[k]) : `{${k}}`;
  });
}

/**
 * Gestor reactivo y ultraligero de internacionalización (i18n) para VanJS.
 */
export function createI18n<T extends Record<string, any> = Record<string, any>>(
  options: I18nOptions<T>
): I18nInstance<T> {
  const storageKey = options.storageKey ?? "vanui-locale";
  const defaultLocale = options.defaultLocale;

  const getSavedLocale = (): string => {
    if (typeof window === "undefined" || !window.localStorage) return defaultLocale;
    const saved = window.localStorage.getItem(storageKey);
    if (saved && options.locales[saved]) {
      return saved;
    }
    return defaultLocale;
  };

  const currentLocale = van.state<string>(getSavedLocale());

  const getText = (key: string, params?: Record<string, string | number>, lang = currentLocale.val): string => {
    const dict = options.locales[lang] || options.locales[defaultLocale];
    let template = resolveKey(dict, key);
    if (template === undefined && lang !== defaultLocale) {
      template = resolveKey(options.locales[defaultLocale], key);
    }
    return template !== undefined ? interpolate(template, params) : key;
  };

  const setLocale = (locale: string) => {
    if (options.locales[locale]) {
      currentLocale.val = locale;
      if (typeof window !== "undefined") {
        if (window.localStorage) {
          window.localStorage.setItem(storageKey, locale);
        }
        if (document.documentElement) {
          document.documentElement.lang = locale;
        }
      }
    }
  };

  // Inicializar atributo lang
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.lang = currentLocale.val;
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    // Leer currentLocale.val en el contexto del llamador garantiza que si t() se
    // invoca dentro de una función o derive de VanJS, el contexto superior también rastree el cambio.
    const _ = currentLocale.val;
    return van.derive(() => getText(key, params, currentLocale.val));
  };

  const raw = (key: string, params?: Record<string, string | number>) => {
    return getText(key, params, currentLocale.val);
  };

  return {
    currentLocale,
    locales: options.locales,
    setLocale,
    getLocale: () => currentLocale.val,
    t,
    raw,
  };
}
