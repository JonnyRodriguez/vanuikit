import van from "vanjs-core";
import type { State } from "vanjs-core";

export interface I18nOptions<T extends Record<string, any> = Record<string, any>> {
  defaultLocale: string;
  locales?: Record<string, T>;
  storageKey?: string;
}

export interface I18nInstance<T extends Record<string, any> = Record<string, any>> {
  currentLocale: State<string>;
  locales: Record<string, Record<string, any>>;
  setLocale: (locale: string) => void;
  getLocale: () => string;
  /**
   * Permite que componentes individuales (como Field, Modal, etc.)
   * registren sus propios diccionarios de traducciones co-ubicados.
   */
  addTranslations: (translations: Record<string, Record<string, any>>) => void;
  /**
   * Retorna una derivación reactiva (State<string>) con el texto traducido.
   * Al insertarlo en el DOM de VanJS, se actualiza automáticamente cuando cambia el idioma.
   */
  t: (key: string, params?: Record<string, string | number>, defaultVal?: string) => State<string>;
  /**
   * Retorna el texto traducido como string estático (no reactivo).
   */
  raw: (key: string, params?: Record<string, string | number>, defaultVal?: string) => string;
}

/** Diccionario global por defecto para VanUI */
export const defaultLocales: Record<string, Record<string, any>> = {
  es: {
    auth: {
      email: "Correo electrónico",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "nombre@ejemplo.com",
      emailRequired: "Ingresa tu correo electrónico",
      emailInvalid: "Correo electrónico inválido",
      password: "Contraseña",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "••••••••",
      passwordRequired: "Ingresa tu contraseña",
      passwordMin: "La contraseña debe tener al menos {min} caracteres",
      name: "Nombre completo",
      nameLabel: "Nombre completo",
      namePlaceholder: "Juan Pérez",
      nameRequired: "Ingresa tu nombre",
      confirmPassword: "Confirmar contraseña",
      confirmLabel: "Confirmar contraseña",
      confirmRequired: "Confirma tu contraseña",
      passwordMismatch: "Las contraseñas no coinciden",
    },
    login: {
      submit: "Iniciar sesión",
      loading: "Iniciando sesión...",
    },
    register: {
      submit: "Crear cuenta",
      loading: "Creando cuenta...",
      nameLabel: "Nombre completo",
      namePlaceholder: "Juan Pérez",
      nameRequired: "Ingresa tu nombre",
    },
  },
  en: {
    auth: {
      email: "Email address",
      emailLabel: "Email",
      emailPlaceholder: "name@example.com",
      emailRequired: "Enter your email address",
      emailInvalid: "Invalid email address format",
      password: "Password",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      passwordRequired: "Enter your password",
      passwordMin: "Password must be at least {min} characters",
      name: "Full name",
      nameLabel: "Full name",
      namePlaceholder: "John Doe",
      nameRequired: "Enter your name",
      confirmPassword: "Confirm password",
      confirmLabel: "Confirm password",
      confirmRequired: "Confirm your password",
      passwordMismatch: "Passwords do not match",
    },
    login: {
      submit: "Sign In",
      loading: "Signing in...",
    },
    register: {
      submit: "Create Account",
      loading: "Creating account...",
      nameLabel: "Full name",
      namePlaceholder: "John Doe",
      nameRequired: "Enter your name",
    },
  },
};

/**
 * Resuelve una llave anidada como "field.email.label" o "auth.email" dentro de un diccionario.
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
 * Reemplaza variables en una cadena: "Mínimo {min} caracteres" -> "Mínimo 6 caracteres"
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    return params[k] !== undefined ? String(params[k]) : `{${k}}`;
  });
}

function deepMerge(target: Record<string, any>, source: Record<string, any>) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

/**
 * Gestor reactivo y ultraligero de internacionalización (i18n) para VanJS.
 */
export function createI18n<T extends Record<string, any> = Record<string, any>>(
  options: I18nOptions<T> = { defaultLocale: "es", locales: defaultLocales as any }
): I18nInstance<T> {
  const storageKey = options.storageKey ?? "vanui-locale";
  const defaultLocale = options.defaultLocale;
  const localesData: Record<string, Record<string, any>> = options.locales ?? (JSON.parse(JSON.stringify(defaultLocales)));

  const getSavedLocale = (): string => {
    if (typeof window === "undefined" || !window.localStorage) return defaultLocale;
    const saved = window.localStorage.getItem(storageKey);
    if (saved && localesData[saved]) {
      return saved;
    }
    return defaultLocale;
  };

  const currentLocale = van.state<string>(getSavedLocale());

  const getText = (
    key: string,
    params?: Record<string, string | number>,
    defaultVal?: string,
    lang = currentLocale.val,
  ): string => {
    const dict = localesData[lang] || localesData[defaultLocale];
    let template = resolveKey(dict, key);
    if (template === undefined && lang !== defaultLocale) {
      template = resolveKey(localesData[defaultLocale], key);
    }
    if (template !== undefined) {
      return interpolate(template, params);
    }
    return defaultVal !== undefined ? interpolate(defaultVal, params) : key;
  };

  const addTranslations = (newTranslations: Record<string, Record<string, any>>) => {
    deepMerge(localesData, newTranslations);
    const curr = currentLocale.val;
    currentLocale.val = curr;
  };

  const setLocale = (locale: string) => {
    if (localesData[locale]) {
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

  const t = (key: string, params?: Record<string, string | number>, defaultVal?: string) => {
    return van.derive(() => {
      const _ = currentLocale.val;
      return getText(key, params, defaultVal, currentLocale.val);
    });
  };

  const raw = (key: string, params?: Record<string, string | number>, defaultVal?: string) => {
    return getText(key, params, defaultVal, currentLocale.val);
  };

  return {
    currentLocale,
    locales: localesData,
    setLocale,
    getLocale: () => currentLocale.val,
    addTranslations,
    t,
    raw,
  };
}

/** Singleton global de i18n */
export const i18n = createI18n({
  defaultLocale: "es",
  locales: defaultLocales,
});

/** Helper reactivo directo con el singleton */
export const t = (key: string, params?: Record<string, string | number>, defaultVal?: string): State<string> =>
  i18n.t(key, params, defaultVal);

/** Helper raw directo con el singleton */
export const raw = (key: string, params?: Record<string, string | number>, defaultVal?: string): string =>
  i18n.raw(key, params, defaultVal);
