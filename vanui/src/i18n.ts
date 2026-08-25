import van from "vanjs-core";
import type { State } from "vanjs-core";

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

// ---------------------------------------------------------------------
// Helper para formularios de la librería (fuente única de verdad)
// ---------------------------------------------------------------------

/** Descriptor de un texto de formulario. */
export type I18nFormEntry = {
  /** Nombre local del texto (cómo se accede, p. ej. "emailLabel"). */
  name: string;
  /** Llave del diccionario i18n (p. ej. "auth.emailLabel"); usada a falta de default. */
  key: string;
     /** Default en inglés (fallback cuando no hay i18n o falta la llave). */
  default: string;
  /** true → raw() (string, no reactivo) para validación/spinner; false → t() reactivo. */
  raw?: boolean;
  /** Params de interpolación, p. ej. { min: 6 }. */
  params?: Record<string, string | number>;
};

/**
 * Construye el mapa `{ nombre: texto }` de un formulario a partir de un array
 * de descriptores (una única fuente de verdad). Así, extender un formulario
 * con un idioma/texto nuevo es añadir una línea al array, no tocar varios
 * sitios. El tipo de retorno deriva que las entradas `raw: true` son `string`
 * y el resto `State<string>` (reactivas), según el `i18n` provisto.
 */
export function makeFormTexts<const T extends readonly I18nFormEntry[]>(
  entries: T,
  i18n?: I18nInstance,
): {
  [K in T[number]["name"]]: Extract<T[number], { name: K }> extends { raw: true }
    ? string
    : State<string>;
} {
  const out = {} as Record<string, string | State<string>>;
  for (const entry of entries) {
    out[entry.name] = i18n
      ? entry.raw
        ? i18n.raw(entry.key, entry.params)
        : i18n.t(entry.key, entry.params)
      : entry.default;
  }
  return out as any;
}
