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
  t: (key: string, defaultVal?: string, params?: Record<string, string | number>) => State<string>;
  /**
   * Retorna el texto traducido como string estático (no reactivo).
   */
  raw: (key: string, defaultVal?: string, params?: Record<string, string | number>) => string;
}

/** Diccionario global por defecto para VanUikit */
export const defaultLocales: Record<string, Record<string, any>> = {
  es: {
    field: {
      email: {
        label: "Correo electrónico",
        placeholder: "tucorreo@ejemplo.com",
        required: "Ingresa tu correo electrónico",
        invalid: "Correo electrónico inválido",
      },
      password: {
        label: "Contraseña",
        placeholder: "••••••••",
        required: "Ingresa tu contraseña",
        min: "La contraseña debe tener al menos {min} caracteres",
      },
      confirm: {
        label: "Confirmar contraseña",
        placeholder: "••••••••",
        required: "Confirma tu contraseña",
        mismatch: "Las contraseñas no coinciden",
      },
      name: {
        label: "Nombre completo",
        placeholder: "Juan Pérez",
        required: "Ingresa tu nombre",
      },
      message: {
        label: "Mensaje",
        placeholder: "Escribe aquí...",
        required: "Escribe tu mensaje",
      },
    },
    checkbox: {
      required: "Debes marcar esta opción",
    },
    switch: {
      required: "Debes activar esta opción",
    },
    radio: {
      required: "Selecciona una opción",
    },
    alert: {
      dismiss: "Cerrar aviso",
    },
    breadcrumbs: {
      ariaLabel: "Ruta de navegación",
    },
    pagination: {
      ariaLabel: "Paginación",
      previous: "Anterior",
      next: "Siguiente",
    },
    combobox: {
      remove: "Quitar {name}",
    },
    datepicker: {
      placeholder: "Seleccionar fecha",
      prevMonth: "Mes anterior",
      nextMonth: "Mes siguiente",
      today: "Hoy",
      required: "Selecciona una fecha",
    },
    wizard: {
      back: "Atrás",
      next: "Siguiente",
      submit: "Enviar",
      step: "Paso {actual} de {total}",
      checkSteps: "Revisa el paso {pasos}",
    },
    nav: {
      logout: "Cerrar sesión",
      ariaLabel: "Navegación principal",
    },
    sidebar: {
      title: "Sidebar",
      collapse: "Colapsar barra lateral",
      expand: "Expandir barra lateral",
      close: "Cerrar menú",
      resize: "Ajustar ancho de la barra lateral",
    },
    router: {
      notFound: "404 - No encontrado",
      loading: "Cargando...",
    },
    user: {
      sessionActive: "Sesión activa",
    },
    theme: {
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
      selectLabel: "Seleccionar tema visual",
      toggleLabel: "Alternar tema visual (Claro / Oscuro / Sistema)",
      toggleTitle: "Alternar tema (Claro / Oscuro / Sistema)",
    },
    dialog: {
      confirmTitle: "Confirmar acción",
      cancel: "Cancelar",
      confirm: "Confirmar",
    },
    modal: {
      close: "Cerrar",
    },
    dropdown: {
      empty: "No se encontraron resultados",
      searchPlaceholder: "Buscar...",
      placeholder: "Seleccionar opción...",
    },
    locale: {
      selectLabel: "Idioma / Language",
      groupLabel: "Selector de idioma",
    },
    table: {
      searchPlaceholder: "Buscar en la tabla...",
      emptyText: "No hay datos disponibles",
      selectedCount: "{count} seleccionados",
      showing: "Mostrando {start} - {end} de {total}",
      prev: "← Anterior",
      next: "Siguiente →",
    },
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
    field: {
      email: {
        label: "Email",
        placeholder: "you@example.com",
        required: "Please enter your email",
        invalid: "Invalid email address",
      },
      password: {
        label: "Password",
        placeholder: "••••••••",
        required: "Please enter your password",
        min: "Password must be at least {min} characters",
      },
      confirm: {
        label: "Confirm password",
        placeholder: "••••••••",
        required: "Please confirm your password",
        mismatch: "Passwords do not match",
      },
      name: {
        label: "Full name",
        placeholder: "John Doe",
        required: "Please enter your name",
      },
      message: {
        label: "Message",
        placeholder: "Write here...",
        required: "Please enter your message",
      },
    },
    checkbox: {
      required: "You must check this option",
    },
    switch: {
      required: "You must turn this option on",
    },
    radio: {
      required: "Please select an option",
    },
    alert: {
      dismiss: "Dismiss alert",
    },
    breadcrumbs: {
      ariaLabel: "Breadcrumb",
    },
    pagination: {
      ariaLabel: "Pagination",
      previous: "Previous",
      next: "Next",
    },
    combobox: {
      remove: "Remove {name}",
    },
    datepicker: {
      placeholder: "Select a date",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      today: "Today",
      required: "Please select a date",
    },
    wizard: {
      back: "Back",
      next: "Next",
      submit: "Submit",
      step: "Step {actual} of {total}",
      checkSteps: "Check step {pasos}",
    },
    nav: {
      logout: "Sign out",
      ariaLabel: "Main navigation",
    },
    sidebar: {
      title: "Sidebar",
      collapse: "Collapse sidebar",
      expand: "Expand sidebar",
      close: "Close menu",
      resize: "Resize sidebar",
    },
    router: {
      notFound: "404 - Not found",
      loading: "Loading...",
    },
    user: {
      sessionActive: "Active session",
    },
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
      selectLabel: "Select visual theme",
      toggleLabel: "Toggle visual theme (Light / Dark / System)",
      toggleTitle: "Toggle theme (Light / Dark / System)",
    },
    dialog: {
      confirmTitle: "Confirm action",
      cancel: "Cancel",
      confirm: "Confirm",
    },
    modal: {
      close: "Close",
    },
    dropdown: {
      empty: "No results found",
      searchPlaceholder: "Search...",
      placeholder: "Select an option...",
    },
    locale: {
      selectLabel: "Language",
      groupLabel: "Language selector",
    },
    table: {
      searchPlaceholder: "Search the table...",
      emptyText: "No data available",
      selectedCount: "{count} selected",
      showing: "Showing {start} - {end} of {total}",
      prev: "← Previous",
      next: "Next →",
    },
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
  options: I18nOptions<T> = { defaultLocale: "en", locales: defaultLocales as any }
): I18nInstance<T> {
  const storageKey = options.storageKey ?? "vanuikit-locale";
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
  // Incrementa en cada addTranslations: t()/raw() lo leen para re-resolver
  // textos ya renderizados (asignar el mismo locale no dispara a VanJS).
  const revision = van.state(0);

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
    // Un locale guardado en localStorage que no existía al crear la instancia
    // (la app lo registra después) puede ser válido ahora: re-aplicarlo.
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(storageKey);
      if (saved && saved !== currentLocale.val && localesData[saved]) {
        currentLocale.val = saved;
      }
    }
    revision.val++;
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

  const t = (key: string, defaultVal?: string, params?: Record<string, string | number>) => {
    return van.derive(() => {
      void revision.val;
      return getText(key, params, defaultVal, currentLocale.val);
    });
  };

  const raw = (key: string, defaultVal?: string, params?: Record<string, string | number>) => {
    void revision.val;
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
  defaultLocale: "en",
  locales: defaultLocales,
});

/** Helper reactivo directo con el singleton */
export const t = (key: string, defaultVal?: string, params?: Record<string, string | number>): State<string> =>
  i18n.t(key, defaultVal, params);

/** Helper raw directo con el singleton */
export const raw = (key: string, defaultVal?: string, params?: Record<string, string | number>): string =>
  i18n.raw(key, defaultVal, params);
