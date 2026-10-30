// src/index.ts
import van48 from "vanjs-core";

// src/components/button.ts
import van from "vanjs-core";

// src/util.ts
var cx = (...parts) => parts.filter(Boolean).join(" ").trim();
var isRouteActive = (current, href) => href === "/" ? current === "/" : current === href || current.startsWith(`${href}/`);

// src/components/button.ts
var BASE_CLASSES = "font-semibold w-full rounded-md transition duration-200 ease-in-out cursor-pointer border border-transparent";
var VARIANT_CLASSES = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active shadow-primary-shadow",
  secondary: "bg-secondary text-secondary-fg hover:bg-secondary-hover active:bg-secondary-active",
  destructive: "bg-destructive text-white hover:opacity-90 active:opacity-80"
};
var SIZE_CLASSES = {
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3"
};
var Button = (props = {}, ...children) => {
  const {
    class: extra,
    type = "button",
    variant = "primary",
    size = "md",
    ...rest
  } = props;
  return van.tags.button(
    {
      ...rest,
      type,
      class: cx(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        extra
      )
    },
    ...children
  );
};
var PrimaryButton = (props = {}, ...children) => Button({ ...props, variant: "primary" }, ...children);
var SecondaryButton = (props = {}, ...children) => Button({ ...props, variant: "secondary" }, ...children);

// src/components/field.ts
import van3 from "vanjs-core";

// src/validators.ts
var resolveMsg = (msg) => {
  return typeof msg === "string" ? msg : msg.val;
};
var Required = (msg = "Campo requerido") => ({
  validate: (value) => value.trim() ? null : resolveMsg(msg)
});
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var Email = (msg = "Correo electr\xF3nico inv\xE1lido") => ({
  validate: (value) => EMAIL_RE.test(value) ? null : resolveMsg(msg)
});
var MinLength = (min, msg = `M\xEDnimo ${min} caracteres`) => ({
  validate: (value) => value.length >= min ? null : resolveMsg(msg)
});
var Match = (otherName, msg = "No coinciden") => ({
  validate: (value, data) => value === data?.[otherName] ? null : resolveMsg(msg)
});

// src/i18n.ts
import van2 from "vanjs-core";
var defaultLocales = {
  es: {
    field: {
      email: {
        label: "Correo electr\xF3nico",
        placeholder: "tucorreo@ejemplo.com",
        required: "Ingresa tu correo electr\xF3nico",
        invalid: "Correo electr\xF3nico inv\xE1lido"
      },
      password: {
        label: "Contrase\xF1a",
        placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
        required: "Ingresa tu contrase\xF1a",
        min: "La contrase\xF1a debe tener al menos {min} caracteres"
      },
      confirm: {
        label: "Confirmar contrase\xF1a",
        placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
        required: "Confirma tu contrase\xF1a",
        mismatch: "Las contrase\xF1as no coinciden"
      },
      name: {
        label: "Nombre completo",
        placeholder: "Juan P\xE9rez",
        required: "Ingresa tu nombre"
      },
      message: {
        label: "Mensaje",
        placeholder: "Escribe aqu\xED...",
        required: "Escribe tu mensaje"
      }
    },
    checkbox: {
      required: "Debes marcar esta opci\xF3n"
    },
    switch: {
      required: "Debes activar esta opci\xF3n"
    },
    radio: {
      required: "Selecciona una opci\xF3n"
    },
    alert: {
      dismiss: "Cerrar aviso"
    },
    breadcrumbs: {
      ariaLabel: "Ruta de navegaci\xF3n"
    },
    pagination: {
      ariaLabel: "Paginaci\xF3n",
      previous: "Anterior",
      next: "Siguiente"
    },
    combobox: {
      remove: "Quitar {name}"
    },
    datepicker: {
      placeholder: "Seleccionar fecha",
      prevMonth: "Mes anterior",
      nextMonth: "Mes siguiente",
      today: "Hoy",
      required: "Selecciona una fecha"
    },
    wizard: {
      back: "Atr\xE1s",
      next: "Siguiente",
      submit: "Enviar",
      step: "Paso {actual} de {total}",
      checkSteps: "Revisa el paso {pasos}"
    },
    nav: {
      logout: "Cerrar sesi\xF3n",
      ariaLabel: "Navegaci\xF3n principal"
    },
    sidebar: {
      title: "Sidebar",
      collapse: "Colapsar barra lateral",
      expand: "Expandir barra lateral",
      close: "Cerrar men\xFA"
    },
    router: {
      notFound: "404 - No encontrado",
      loading: "Cargando..."
    },
    user: {
      sessionActive: "Sesi\xF3n activa"
    },
    theme: {
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
      selectLabel: "Seleccionar tema visual",
      toggleLabel: "Alternar tema visual (Claro / Oscuro / Sistema)",
      toggleTitle: "Alternar tema (Claro / Oscuro / Sistema)"
    },
    dialog: {
      confirmTitle: "Confirmar acci\xF3n",
      cancel: "Cancelar",
      confirm: "Confirmar"
    },
    modal: {
      close: "Cerrar"
    },
    dropdown: {
      empty: "No se encontraron resultados",
      searchPlaceholder: "Buscar..."
    },
    locale: {
      selectLabel: "Idioma / Language",
      groupLabel: "Selector de idioma"
    },
    table: {
      searchPlaceholder: "Buscar en la tabla...",
      emptyText: "No hay datos disponibles",
      selectedCount: "{count} seleccionados",
      showing: "Mostrando {start} - {end} de {total}",
      prev: "\u2190 Anterior",
      next: "Siguiente \u2192"
    },
    auth: {
      email: "Correo electr\xF3nico",
      emailLabel: "Correo electr\xF3nico",
      emailPlaceholder: "nombre@ejemplo.com",
      emailRequired: "Ingresa tu correo electr\xF3nico",
      emailInvalid: "Correo electr\xF3nico inv\xE1lido",
      password: "Contrase\xF1a",
      passwordLabel: "Contrase\xF1a",
      passwordPlaceholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      passwordRequired: "Ingresa tu contrase\xF1a",
      passwordMin: "La contrase\xF1a debe tener al menos {min} caracteres",
      name: "Nombre completo",
      nameLabel: "Nombre completo",
      namePlaceholder: "Juan P\xE9rez",
      nameRequired: "Ingresa tu nombre",
      confirmPassword: "Confirmar contrase\xF1a",
      confirmLabel: "Confirmar contrase\xF1a",
      confirmRequired: "Confirma tu contrase\xF1a",
      passwordMismatch: "Las contrase\xF1as no coinciden"
    },
    login: {
      submit: "Iniciar sesi\xF3n",
      loading: "Iniciando sesi\xF3n..."
    },
    register: {
      submit: "Crear cuenta",
      loading: "Creando cuenta...",
      nameLabel: "Nombre completo",
      namePlaceholder: "Juan P\xE9rez",
      nameRequired: "Ingresa tu nombre"
    }
  },
  en: {
    field: {
      email: {
        label: "Email",
        placeholder: "you@example.com",
        required: "Please enter your email",
        invalid: "Invalid email address"
      },
      password: {
        label: "Password",
        placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
        required: "Please enter your password",
        min: "Password must be at least {min} characters"
      },
      confirm: {
        label: "Confirm password",
        placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
        required: "Please confirm your password",
        mismatch: "Passwords do not match"
      },
      name: {
        label: "Full name",
        placeholder: "John Doe",
        required: "Please enter your name"
      },
      message: {
        label: "Message",
        placeholder: "Write here...",
        required: "Please enter your message"
      }
    },
    checkbox: {
      required: "You must check this option"
    },
    switch: {
      required: "You must turn this option on"
    },
    radio: {
      required: "Please select an option"
    },
    alert: {
      dismiss: "Dismiss alert"
    },
    breadcrumbs: {
      ariaLabel: "Breadcrumb"
    },
    pagination: {
      ariaLabel: "Pagination",
      previous: "Previous",
      next: "Next"
    },
    combobox: {
      remove: "Remove {name}"
    },
    datepicker: {
      placeholder: "Select a date",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      today: "Today",
      required: "Please select a date"
    },
    wizard: {
      back: "Back",
      next: "Next",
      submit: "Submit",
      step: "Step {actual} of {total}",
      checkSteps: "Check step {pasos}"
    },
    nav: {
      logout: "Sign out",
      ariaLabel: "Main navigation"
    },
    sidebar: {
      title: "Sidebar",
      collapse: "Collapse sidebar",
      expand: "Expand sidebar",
      close: "Close menu"
    },
    router: {
      notFound: "404 - Not found",
      loading: "Loading..."
    },
    user: {
      sessionActive: "Active session"
    },
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
      selectLabel: "Select visual theme",
      toggleLabel: "Toggle visual theme (Light / Dark / System)",
      toggleTitle: "Toggle theme (Light / Dark / System)"
    },
    dialog: {
      confirmTitle: "Confirm action",
      cancel: "Cancel",
      confirm: "Confirm"
    },
    modal: {
      close: "Close"
    },
    dropdown: {
      empty: "No results found",
      searchPlaceholder: "Search..."
    },
    locale: {
      selectLabel: "Language",
      groupLabel: "Language selector"
    },
    table: {
      searchPlaceholder: "Search the table...",
      emptyText: "No data available",
      selectedCount: "{count} selected",
      showing: "Showing {start} - {end} of {total}",
      prev: "\u2190 Previous",
      next: "Next \u2192"
    },
    auth: {
      email: "Email address",
      emailLabel: "Email",
      emailPlaceholder: "name@example.com",
      emailRequired: "Enter your email address",
      emailInvalid: "Invalid email address format",
      password: "Password",
      passwordLabel: "Password",
      passwordPlaceholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      passwordRequired: "Enter your password",
      passwordMin: "Password must be at least {min} characters",
      name: "Full name",
      nameLabel: "Full name",
      namePlaceholder: "John Doe",
      nameRequired: "Enter your name",
      confirmPassword: "Confirm password",
      confirmLabel: "Confirm password",
      confirmRequired: "Confirm your password",
      passwordMismatch: "Passwords do not match"
    },
    login: {
      submit: "Sign In",
      loading: "Signing in..."
    },
    register: {
      submit: "Create Account",
      loading: "Creating account...",
      nameLabel: "Full name",
      namePlaceholder: "John Doe",
      nameRequired: "Enter your name"
    }
  }
};
function resolveKey(dict, key) {
  if (!dict) return void 0;
  const parts = key.split(".");
  let current = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return void 0;
    current = current[part];
  }
  return typeof current === "string" ? current : void 0;
}
function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    return params[k] !== void 0 ? String(params[k]) : `{${k}}`;
  });
}
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
function createI18n(options = { defaultLocale: "en", locales: defaultLocales }) {
  const storageKey = options.storageKey ?? "vanuikit-locale";
  const defaultLocale = options.defaultLocale;
  const localesData = options.locales ?? JSON.parse(JSON.stringify(defaultLocales));
  const getSavedLocale = () => {
    if (typeof window === "undefined" || !window.localStorage) return defaultLocale;
    const saved = window.localStorage.getItem(storageKey);
    if (saved && localesData[saved]) {
      return saved;
    }
    return defaultLocale;
  };
  const currentLocale = van2.state(getSavedLocale());
  const revision = van2.state(0);
  const getText = (key, params, defaultVal, lang = currentLocale.val) => {
    const dict = localesData[lang] || localesData[defaultLocale];
    let template = resolveKey(dict, key);
    if (template === void 0 && lang !== defaultLocale) {
      template = resolveKey(localesData[defaultLocale], key);
    }
    if (template !== void 0) {
      return interpolate(template, params);
    }
    return defaultVal !== void 0 ? interpolate(defaultVal, params) : key;
  };
  const addTranslations = (newTranslations) => {
    deepMerge(localesData, newTranslations);
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(storageKey);
      if (saved && saved !== currentLocale.val && localesData[saved]) {
        currentLocale.val = saved;
      }
    }
    revision.val++;
  };
  const setLocale = (locale) => {
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
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.lang = currentLocale.val;
  }
  const t2 = (key, defaultVal, params) => {
    return van2.derive(() => {
      void revision.val;
      return getText(key, params, defaultVal, currentLocale.val);
    });
  };
  const raw2 = (key, defaultVal, params) => {
    void revision.val;
    return getText(key, params, defaultVal, currentLocale.val);
  };
  return {
    currentLocale,
    locales: localesData,
    setLocale,
    getLocale: () => currentLocale.val,
    addTranslations,
    t: t2,
    raw: raw2
  };
}
var i18n = createI18n({
  defaultLocale: "en",
  locales: defaultLocales
});
var t = (key, defaultVal, params) => i18n.t(key, defaultVal, params);
var raw = (key, defaultVal, params) => i18n.raw(key, defaultVal, params);

// src/components/field.ts
var TEXTS = {
  email: {
    label: { key: "field.email.label", default: "Correo electr\xF3nico" },
    placeholder: { key: "field.email.placeholder", default: "tucorreo@ejemplo.com" },
    required: { key: "field.email.required", default: "Ingresa tu correo electr\xF3nico" },
    invalid: { key: "field.email.invalid", default: "Correo electr\xF3nico inv\xE1lido" }
  },
  password: {
    label: { key: "field.password.label", default: "Contrase\xF1a" },
    placeholder: { key: "field.password.placeholder", default: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" },
    required: { key: "field.password.required", default: "Ingresa tu contrase\xF1a" },
    min: { key: "field.password.min", default: "La contrase\xF1a debe tener al menos {min} caracteres" }
  },
  name: {
    label: { key: "field.name.label", default: "Nombre completo" },
    placeholder: { key: "field.name.placeholder", default: "Juan P\xE9rez" },
    required: { key: "field.name.required", default: "Ingresa tu nombre" }
  }
};
var Field = (options, initialValidators = []) => {
  const { div: div7, label, input: input3, p: p2 } = van3.tags;
  const value = van3.state("");
  const error = van3.state("");
  const isTouched = van3.state(false);
  const validators = [...initialValidators];
  const isValid = van3.derive(() => !error.val && value.val.length > 0);
  const isInvalid = van3.derive(() => isTouched.val && !!error.val);
  const stateClass = van3.derive(
    () => isTouched.val ? isInvalid.val ? "field-invalid" : "field-valid" : "field-pristine"
  );
  const validate = (valueOrData, data) => {
    isTouched.val = true;
    let valToTest = value.val;
    let contextData = data;
    if (typeof valueOrData === "string") {
      valToTest = valueOrData;
      value.val = valueOrData;
    } else if (valueOrData && typeof valueOrData === "object") {
      contextData = valueOrData;
      if (valueOrData[options.name] !== void 0) {
        valToTest = String(valueOrData[options.name]);
        value.val = valToTest;
      }
    }
    for (const v of validators) {
      const err = v.validate(valToTest, contextData);
      if (err) {
        error.val = err;
        return false;
      }
    }
    error.val = "";
    return true;
  };
  const field = {
    name: options.name,
    value,
    error,
    isTouched,
    isValid,
    isInvalid,
    stateClass,
    addValidator(validator) {
      validators.push(validator);
      return field;
    },
    validate,
    setError(msg) {
      error.val = msg;
      isTouched.val = true;
    },
    clearError() {
      error.val = "";
    },
    dom() {
      const { textarea } = van3.tags;
      const inputClass = van3.derive(
        () => `w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 ${isInvalid.val ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-accent/30 focus:border-accent"}`
      );
      const errorText = van3.derive(() => isInvalid.val || isTouched.val && !!error.val ? error.val : "");
      const controlProps = {
        id: options.name,
        name: options.name,
        class: inputClass,
        value: () => value.val,
        placeholder: options.placeholder ?? "",
        disabled: options.disabled ?? false,
        oninput: (e) => {
          value.val = e.target.value;
          if (isTouched.val) validate();
        },
        onblur: () => {
          isTouched.val = true;
          validate();
        }
      };
      return div7(
        { class: () => `field flex flex-col gap-1 text-sm font-sans ${stateClass.val}` },
        label(
          { class: "font-medium text-foreground", for: options.name },
          options.label
        ),
        options.multiline ? textarea({ ...controlProps, rows: options.rows ?? 4 }) : input3({ ...controlProps, type: options.inputType ?? "text" }),
        p2(
          {
            class: () => errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden"
          },
          () => errorText.val
        ),
        options.hint ? p2({ class: "field-hint text-xs text-foreground-soft mt-0.5" }, options.hint) : null
      );
    }
  };
  return field;
};
function TextField(optionsOrLabel = "text", name = "text", placeholder) {
  if (typeof optionsOrLabel === "string") {
    return Field(
      { label: optionsOrLabel, name, inputType: "text", placeholder },
      [Required(t("field.name.required", "Ingresa tu nombre"))]
    );
  }
  const {
    label = t("field.name.label", "Nombre completo"),
    name: fieldName = "name",
    placeholder: ph = t("field.name.placeholder", "Juan P\xE9rez"),
    hint,
    required = true,
    requiredMsg = t("field.name.required", "Ingresa tu nombre")
  } = optionsOrLabel;
  const validators = [];
  if (required) {
    validators.push(Required(requiredMsg));
  }
  return Field({ label, name: fieldName, inputType: "text", placeholder: ph || void 0, hint }, validators);
}
function EmailField(optionsOrLabel = {}, name = "email", placeholder) {
  if (typeof optionsOrLabel === "string") {
    return Field(
      { label: optionsOrLabel, name, inputType: "email", placeholder: placeholder ?? TEXTS.email.placeholder.default },
      [
        Required(t("field.email.required", "Ingresa tu correo electr\xF3nico")),
        Email(t("field.email.invalid", "Correo electr\xF3nico inv\xE1lido"))
      ]
    );
  }
  const {
    label = t("field.email.label", "Correo electr\xF3nico"),
    name: fieldName = "email",
    placeholder: ph = t("field.email.placeholder", "tucorreo@ejemplo.com"),
    hint,
    requiredMsg = t("field.email.required", "Ingresa tu correo electr\xF3nico"),
    invalidMsg = t("field.email.invalid", "Correo electr\xF3nico inv\xE1lido")
  } = optionsOrLabel;
  return Field(
    { label, name: fieldName, inputType: "email", placeholder: ph || void 0, hint },
    [
      Required(requiredMsg),
      Email(invalidMsg)
    ]
  );
}
function PasswordField(optionsOrLabel = {}, name = "password", placeholder, min = 6) {
  if (typeof optionsOrLabel === "string") {
    const minLength2 = min ?? 6;
    return Field(
      { label: optionsOrLabel, name, inputType: "password", placeholder: placeholder ?? TEXTS.password.placeholder.default },
      [
        Required(t("field.password.required", "Ingresa tu contrase\xF1a")),
        MinLength(minLength2, t("field.password.min", "La contrase\xF1a debe tener al menos {min} caracteres", { min: minLength2 }))
      ]
    );
  }
  const {
    label = t("field.password.label", "Contrase\xF1a"),
    name: fieldName = "password",
    placeholder: ph = t("field.password.placeholder", "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"),
    hint,
    min: minLength = 6,
    requiredMsg = t("field.password.required", "Ingresa tu contrase\xF1a"),
    minMsg = t("field.password.min", "La contrase\xF1a debe tener al menos {min} caracteres", { min: minLength })
  } = optionsOrLabel;
  return Field(
    { label, name: fieldName, inputType: "password", placeholder: ph || void 0, hint },
    [
      Required(requiredMsg),
      MinLength(minLength, minMsg)
    ]
  );
}
function TextareaField(options = {}) {
  const {
    label = t("field.message.label", "Mensaje"),
    name: fieldName = "message",
    placeholder: ph = t("field.message.placeholder", "Escribe aqu\xED..."),
    hint,
    required = true,
    requiredMsg = t("field.message.required", "Escribe tu mensaje"),
    rows = 4
  } = options;
  const validators = required ? [Required(requiredMsg)] : [];
  return Field(
    { label, name: fieldName, multiline: true, rows, placeholder: ph || void 0, hint },
    validators
  );
}

// src/components/checkbox.ts
import van6 from "vanjs-core";

// src/components/checkable.ts
import van4 from "vanjs-core";
var asState = (value, initial) => value !== void 0 && typeof value === "object" ? value : van4.state(value === void 0 ? initial : value);
var readState = (value, fallback) => value === void 0 ? fallback : typeof value === "object" ? value.val : value;
var createControlField = (spec, extra, initialValidators = []) => {
  const error = van4.state("");
  const isTouched = van4.state(false);
  const validators = [...initialValidators];
  const isValid = van4.derive(() => !error.val && spec.value.val.length > 0);
  const isInvalid = van4.derive(() => isTouched.val && !!error.val);
  const stateClass = van4.derive(
    () => isTouched.val ? isInvalid.val ? "field-invalid" : "field-valid" : "field-pristine"
  );
  const validate = (valueOrData, data) => {
    isTouched.val = true;
    let valToTest = spec.currentValue();
    let contextData = data;
    if (typeof valueOrData === "string") {
      spec.applyValue(valueOrData);
      valToTest = valueOrData;
    } else if (valueOrData && typeof valueOrData === "object") {
      contextData = valueOrData;
      if (valueOrData[spec.name] !== void 0) {
        valToTest = String(valueOrData[spec.name]);
        spec.applyValue(valToTest);
      }
    }
    for (const v of validators) {
      const err = v.validate(valToTest, contextData);
      if (err) {
        error.val = err;
        return false;
      }
    }
    error.val = "";
    return true;
  };
  const control = {
    name: spec.name,
    value: spec.value,
    error,
    isTouched,
    isValid,
    isInvalid,
    stateClass,
    validate,
    setError(msg) {
      error.val = msg;
      isTouched.val = true;
    },
    clearError() {
      error.val = "";
    },
    addValidator(validator) {
      validators.push(validator);
      return control;
    },
    ...extra
  };
  return control;
};

// src/components/svg.ts
import van5 from "vanjs-core";
var SVG_NS = "http://www.w3.org/2000/svg";
var { svg, path } = van5.tags(SVG_NS);
function Svg(props, ...children) {
  return svg(props, ...children);
}
function SvgPath(props) {
  const { d, ...rest } = props;
  return path({ d, ...rest });
}

// src/components/checkbox.ts
var BOX_SIZES = {
  sm: { box: "size-3.5 rounded", icon: "w-2.5", labelSize: "text-xs", desc: "text-[10px]", offset: "mt-0.5" },
  md: { box: "size-4 rounded", icon: "w-3", labelSize: "text-sm", desc: "text-xs", offset: "mt-0.5" },
  lg: { box: "size-5 rounded-md", icon: "w-3.5", labelSize: "text-base", desc: "text-sm", offset: "mt-1" }
};
var Checkbox = (options = {}) => {
  const { div: div7, label, input: input3, p: p2, span: span7 } = van6.tags;
  const name = options.name ?? "checkbox";
  const sizes = BOX_SIZES[options.size ?? "md"];
  const checked = asState(options.checked, false);
  const indeterminate = asState(options.indeterminate, false);
  const disabled = asState(options.disabled, false);
  const focused = van6.state(false);
  const value = van6.derive(() => checked.val ? "on" : "");
  const requiredMsg = options.requiredMsg ?? t("checkbox.required", "Debes marcar esta opci\xF3n");
  const validators = options.required ? [Required(requiredMsg)] : [];
  let field;
  const dom = () => {
    const boxClass = van6.derive(
      () => cx(
        "flex shrink-0 items-center justify-center border transition-colors",
        sizes.box,
        sizes.offset,
        focused.val ? "ring-2 ring-accent/40 border-accent" : "",
        checked.val || indeterminate.val ? "bg-accent border-accent text-white" : "bg-card border-border",
        disabled.val ? "opacity-50 cursor-not-allowed" : ""
      )
    );
    const checkClass = van6.derive(
      () => checked.val && !indeterminate.val ? "opacity-100" : "opacity-0"
    );
    const dashClass = van6.derive(
      () => indeterminate.val && !checked.val ? "opacity-100" : "opacity-0"
    );
    const errorText = van6.derive(
      () => field.isInvalid.val || field.isTouched.val && !!field.error.val ? field.error.val : ""
    );
    const inputAttrs = {
      type: "checkbox",
      id: name,
      name,
      class: "sr-only",
      checked: () => checked.val,
      indeterminate: () => indeterminate.val,
      disabled: () => disabled.val,
      "aria-invalid": () => field.isInvalid.val ? "true" : "false",
      onchange: (e) => {
        checked.val = e.target.checked;
        if (field.isTouched.val) field.validate();
      },
      onfocus: () => {
        focused.val = true;
      },
      onblur: () => {
        focused.val = false;
        field.isTouched.val = true;
        field.validate();
      }
    };
    if (options.description) inputAttrs["aria-describedby"] = `${name}-description`;
    return div7(
      { class: () => cx("field flex flex-col gap-1", field.stateClass.val, options.class) },
      label(
        {
          class: () => cx("flex items-start gap-2.5", disabled.val ? "cursor-not-allowed" : "cursor-pointer")
        },
        input3(inputAttrs),
        span7(
          { class: boxClass, "aria-hidden": "true" },
          Svg(
            {
              viewBox: "0 0 12 12",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            },
            SvgPath({ d: "M2.5 6.5 5 9 9.5 3", class: checkClass }),
            SvgPath({ d: "M2.5 6h7", class: dashClass })
          )
        ),
        span7(
          { class: "flex flex-col" },
          options.label !== void 0 ? span7({ class: () => cx(sizes.labelSize, "font-medium text-foreground") }, options.label) : null,
          options.description ? span7(
            { id: `${name}-description`, class: () => cx(sizes.desc, "text-foreground-soft") },
            options.description
          ) : null
        )
      ),
      p2(
        { class: () => errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden" },
        () => errorText.val
      )
    );
  };
  field = createControlField(
    {
      name,
      value,
      currentValue: () => checked.val ? "on" : "",
      applyValue: (rawStr) => {
        checked.val = rawStr !== "";
      }
    },
    { checked, dom },
    validators
  );
  return field;
};

// src/components/switch.ts
import van7 from "vanjs-core";
var TRACK_SIZES = {
  sm: { track: "w-8 h-4", thumb: "w-3 h-3", on: "translate-x-4", labelSize: "text-xs", desc: "text-[10px]" },
  md: { track: "w-10 h-5", thumb: "w-4 h-4", on: "translate-x-5", labelSize: "text-sm", desc: "text-xs" },
  lg: { track: "w-12 h-6", thumb: "w-5 h-5", on: "translate-x-6", labelSize: "text-base", desc: "text-sm" }
};
var Switch = (options = {}) => {
  const { div: div7, label, input: input3, p: p2, span: span7 } = van7.tags;
  const name = options.name ?? "switch";
  const sizes = TRACK_SIZES[options.size ?? "md"];
  const checked = asState(options.checked, false);
  const disabled = asState(options.disabled, false);
  const focused = van7.state(false);
  const value = van7.derive(() => checked.val ? "on" : "");
  const requiredMsg = options.requiredMsg ?? t("switch.required", "Debes activar esta opci\xF3n");
  const validators = options.required ? [Required(requiredMsg)] : [];
  let field;
  const dom = () => {
    const trackClass = van7.derive(
      () => cx(
        "flex shrink-0 items-center rounded-full px-0.5 transition-colors",
        sizes.track,
        focused.val ? "ring-2 ring-accent/40" : "",
        checked.val ? "bg-accent" : "bg-border",
        disabled.val ? "opacity-50 cursor-not-allowed" : ""
      )
    );
    const thumbClass = van7.derive(
      () => cx("rounded-full bg-white shadow transition-transform", sizes.thumb, checked.val ? sizes.on : "")
    );
    const errorText = van7.derive(
      () => field.isInvalid.val || field.isTouched.val && !!field.error.val ? field.error.val : ""
    );
    const inputAttrs = {
      type: "checkbox",
      role: "switch",
      id: name,
      name,
      class: "sr-only",
      checked: () => checked.val,
      disabled: () => disabled.val,
      "aria-invalid": () => field.isInvalid.val ? "true" : "false",
      onchange: (e) => {
        checked.val = e.target.checked;
        if (field.isTouched.val) field.validate();
      },
      onfocus: () => {
        focused.val = true;
      },
      onblur: () => {
        focused.val = false;
        field.isTouched.val = true;
        field.validate();
      }
    };
    if (options.description) inputAttrs["aria-describedby"] = `${name}-description`;
    return div7(
      { class: () => cx("field flex flex-col gap-1", field.stateClass.val, options.class) },
      label(
        {
          class: () => cx("flex items-center gap-2.5", disabled.val ? "cursor-not-allowed" : "cursor-pointer")
        },
        input3(inputAttrs),
        span7({ class: trackClass, "aria-hidden": "true" }, span7({ class: thumbClass })),
        span7(
          { class: "flex flex-col" },
          options.label !== void 0 ? span7({ class: () => cx(sizes.labelSize, "font-medium text-foreground") }, options.label) : null,
          options.description ? span7(
            { id: `${name}-description`, class: () => cx(sizes.desc, "text-foreground-soft") },
            options.description
          ) : null
        )
      ),
      p2(
        { class: () => errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden" },
        () => errorText.val
      )
    );
  };
  field = createControlField(
    {
      name,
      value,
      currentValue: () => checked.val ? "on" : "",
      applyValue: (rawStr) => {
        checked.val = rawStr !== "";
      }
    },
    { checked, dom },
    validators
  );
  return field;
};

// src/components/radio.ts
import van8 from "vanjs-core";
var DOT_SIZES = {
  sm: { box: "size-3.5 rounded-full", dot: "size-1.5", labelSize: "text-xs", desc: "text-[10px]", offset: "mt-0.5" },
  md: { box: "size-4 rounded-full", dot: "size-2", labelSize: "text-sm", desc: "text-xs", offset: "mt-0.5" },
  lg: { box: "size-5 rounded-full", dot: "size-2.5", labelSize: "text-base", desc: "text-sm", offset: "mt-1" }
};
var RadioGroup = (options) => {
  const { div: div7, label, input: input3, p: p2, span: span7 } = van8.tags;
  const name = options.name ?? "radio";
  const sizes = DOT_SIZES[options.size ?? "md"];
  const selected = asState(options.value, "");
  const groupDisabled = asState(options.disabled, false);
  const focusedValue = van8.state("");
  const requiredMsg = options.requiredMsg ?? t("radio.required", "Selecciona una opci\xF3n");
  const validators = options.required ? [Required(requiredMsg)] : [];
  const control = createControlField(
    {
      name,
      value: selected,
      currentValue: () => selected.val,
      applyValue: (rawStr) => {
        selected.val = rawStr;
      }
    },
    validators
  );
  let field;
  const dom = () => {
    const inputByName = /* @__PURE__ */ new Map();
    const isEnabled = (o) => !(groupDisabled.val || readState(o.disabled, false));
    const errorText = van8.derive(
      () => field.isInvalid.val || field.isTouched.val && !!field.error.val ? field.error.val : ""
    );
    const items = options.options.map((o) => {
      const enabled = van8.derive(() => isEnabled(o));
      const boxClass = van8.derive(
        () => cx(
          "flex shrink-0 items-center justify-center border transition-colors",
          sizes.box,
          sizes.offset,
          focusedValue.val === o.value ? "ring-2 ring-accent/40 border-accent" : "",
          selected.val === o.value ? "bg-accent border-accent" : "bg-card border-border",
          enabled.val ? "" : "opacity-50"
        )
      );
      const dotClass = van8.derive(() => selected.val === o.value ? "opacity-100" : "opacity-0");
      const inputAttrs = {
        type: "radio",
        id: `${name}-${o.value}`,
        name,
        value: o.value,
        class: "sr-only",
        checked: () => selected.val === o.value,
        disabled: () => !enabled.val,
        "aria-invalid": () => field.isInvalid.val ? "true" : "false",
        onchange: (e) => {
          if (e.target.checked && isEnabled(o)) {
            selected.val = o.value;
            if (field.isTouched.val) field.validate();
          }
        },
        onfocus: () => {
          focusedValue.val = o.value;
        },
        onblur: () => {
          if (focusedValue.val === o.value) focusedValue.val = "";
          field.isTouched.val = true;
          field.validate();
        },
        onkeydown: (e) => {
          const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          const selectable = options.options.filter((x) => isEnabled(x));
          if (!selectable.length) return;
          const anchor = focusedValue.val || selected.val;
          const cur = selectable.findIndex((x) => x.value === anchor);
          const next = cur === -1 ? selectable[dir === 1 ? 0 : selectable.length - 1] : selectable[(cur + dir + selectable.length) % selectable.length];
          selected.val = next.value;
          inputByName.get(next.value)?.focus();
        }
      };
      const inputEl = input3(inputAttrs);
      inputByName.set(o.value, inputEl);
      return label(
        { class: () => cx("flex items-start gap-2.5", enabled.val ? "cursor-pointer" : "cursor-not-allowed") },
        inputEl,
        span7(
          { class: boxClass, "aria-hidden": "true" },
          span7({ class: () => cx(sizes.dot, "rounded-full bg-white transition-opacity", dotClass.val) })
        ),
        span7(
          { class: "flex flex-col" },
          span7({ class: () => cx(sizes.labelSize, "font-medium text-foreground") }, o.label),
          o.description ? span7({ class: () => cx(sizes.desc, "text-foreground-soft") }, o.description) : null
        )
      );
    });
    const groupAttrs = {
      role: "radiogroup",
      class: () => cx("field radio-group flex flex-col gap-2", field.stateClass.val, options.class)
    };
    if (options.ariaLabel !== void 0) groupAttrs["aria-label"] = options.ariaLabel;
    return div7(
      groupAttrs,
      ...items,
      p2(
        { class: () => errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden" },
        () => errorText.val
      )
    );
  };
  field = createControlField(
    {
      name,
      value: selected,
      currentValue: () => selected.val,
      applyValue: (rawStr) => {
        selected.val = rawStr;
      }
    },
    { dom },
    validators
  );
  return field;
};

// src/components/form.ts
import van9 from "vanjs-core";
var FORM_BASE_CLASSES = "space-y-3";
var normalizeLegacy = (r) => {
  if (!r) return { ok: true };
  if (typeof r === "object" && "error" in r && r.error) {
    return { ok: false, error: r.error };
  }
  return { ok: true };
};
var Form = (config) => {
  const options = typeof config === "function" ? { onSubmit: async (data) => normalizeLegacy(await config(data)) } : config;
  const fields = [];
  const submitting = van9.state(false);
  const error = van9.state("");
  const fieldErrors = van9.state({});
  const fieldByName = (name) => fields.find((f) => f.name === name);
  const applyFieldErrors = (map) => {
    let unmapped;
    for (const [name, msg] of Object.entries(map)) {
      const f = fieldByName(name);
      if (f) f.setError(msg);
      else if (unmapped === void 0) unmapped = msg;
    }
    return unmapped;
  };
  const clearErrors = () => {
    error.val = "";
    fieldErrors.val = {};
    for (const f of fields) f.clearError();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.val) return;
    const formEl = e.target;
    const data = Object.fromEntries(
      new FormData(formEl).entries()
    );
    error.val = "";
    options.onBeforeValidate?.(data);
    if (options.schema) {
      const parsed = options.schema.safeParse(data);
      if (!parsed.success && parsed.error) {
        const map = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "");
          if (key && !(key in map)) map[key] = issue.message;
        }
        fieldErrors.val = map;
        const unmapped = applyFieldErrors(map);
        if (unmapped !== void 0) error.val = unmapped;
        return;
      }
    } else {
      let valid = true;
      for (const f of fields) {
        if (!f.validate(data)) valid = false;
      }
      if (!valid) return;
    }
    options.onBeforeSubmit?.(data);
    clearErrors();
    let result;
    submitting.val = true;
    try {
      result = await options.onSubmit(data);
    } catch (err) {
      result = {
        ok: false,
        error: err instanceof Error ? err.message : "Error inesperado"
      };
    } finally {
      submitting.val = false;
    }
    if (result.ok) {
      options.onSuccess?.(data, result);
      return;
    }
    let general = result.error;
    if (result.fieldErrors) {
      fieldErrors.val = result.fieldErrors;
      const unmapped = applyFieldErrors(result.fieldErrors);
      if (general === void 0 && unmapped !== void 0) general = unmapped;
    }
    if (general !== void 0) error.val = general;
    options.onError?.({ ok: false, error: general, fieldErrors: result.fieldErrors });
  };
  const form = {
    add(...more) {
      fields.push(...more);
      return form;
    },
    get submitting() {
      return submitting;
    },
    get error() {
      return error;
    },
    get fieldErrors() {
      return fieldErrors;
    },
    clear() {
      clearErrors();
    },
    dom(...footer) {
      return van9.tags.form(
        { onsubmit: handleSubmit, class: FORM_BASE_CLASSES },
        ...fields.map((f) => f.dom()),
        ...footer
      );
    }
  };
  return form;
};

// src/components/wizard.ts
import van10 from "vanjs-core";
var Wizard = (options) => {
  const { div: div7, h3, p: p2 } = van10.tags;
  const steps = options.steps;
  const stepIndex = van10.state(0);
  const store = van10.state({});
  const error = van10.state("");
  const submitting = van10.state(false);
  const fieldStep = /* @__PURE__ */ new Map();
  steps.forEach((s, i) => (s.fields ?? []).forEach((f) => fieldStep.set(f.name, i)));
  const collect = (step) => {
    if (step.collect) return step.collect();
    const data = {};
    for (const f of step.fields ?? []) data[f.name] = f.value.val;
    return data;
  };
  const applyErrors = (map) => {
    const step = steps[stepIndex.val];
    let unmapped;
    for (const [name, msg] of Object.entries(map)) {
      const f = (step.fields ?? []).find((x) => x.name === name);
      if (f) f.setError(msg);
      else if (!unmapped) unmapped = msg;
    }
    return unmapped;
  };
  const validateStep = (index) => {
    const step = steps[index];
    const data = { ...store.val, ...collect(step) };
    error.val = "";
    if (step.schema) {
      const parsed = step.schema.safeParse(data);
      if (!parsed.success && parsed.error) {
        const map = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "");
          if (key && !(key in map)) map[key] = issue.message;
        }
        const unmapped = applyErrors(map);
        if (unmapped !== void 0) error.val = unmapped;
        return null;
      }
    } else {
      let ok = true;
      for (const f of step.fields ?? []) if (!f.validate(data)) ok = false;
      if (!ok) return null;
    }
    return data;
  };
  const commit = (data) => {
    store.val = { ...store.val, ...data };
  };
  const goTo = (nextIndex) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, nextIndex));
    const step = steps[clamped];
    for (const f of step.fields ?? []) {
      const v = store.val[f.name];
      if (v !== void 0) f.value.val = v;
    }
    stepIndex.val = clamped;
    error.val = "";
    options.onStepChange?.(clamped);
  };
  const next = () => {
    const data = validateStep(stepIndex.val);
    if (!data) return false;
    commit(data);
    goTo(stepIndex.val + 1);
    return true;
  };
  const back = () => goTo(stepIndex.val - 1);
  const collectStep = (index = stepIndex.val) => ({
    ...store.val,
    ...collect(steps[index])
  });
  const validateCurrent = () => validateStep(stepIndex.val) !== null;
  const submit = async () => {
    const data = validateStep(stepIndex.val);
    if (!data) return;
    commit(data);
    if (submitting.val) return;
    submitting.val = true;
    let result;
    try {
      result = await options.onSubmit(store.val);
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : "Error inesperado" };
    } finally {
      submitting.val = false;
    }
    if (result.ok) {
      options.onSuccess?.(store.val, result);
      return;
    }
    let general = result.error;
    if (result.fieldErrors) {
      const byStep = {};
      let unmapped;
      for (const [name, msg] of Object.entries(result.fieldErrors)) {
        const idx = fieldStep.get(name);
        if (idx === void 0) {
          if (!unmapped) unmapped = msg;
          continue;
        }
        (byStep[idx] ??= {})[name] = msg;
      }
      if (byStep[stepIndex.val]) {
        const um = applyErrors(byStep[stepIndex.val]);
        if (um !== void 0 && general === void 0) general = um;
      }
      const otherSteps = Object.keys(byStep).map(Number).filter((i) => i !== stepIndex.val);
      if (otherSteps.length) {
        general = general ?? raw("wizard.checkSteps", "Revisa el paso {pasos}", {
          pasos: otherSteps.map((i) => i + 1).join(", ")
        });
      } else if (unmapped !== void 0 && general === void 0) {
        general = unmapped;
      }
    }
    if (general !== void 0) error.val = general;
    options.onError?.({ ok: false, error: general, fieldErrors: result.fieldErrors });
  };
  const currentTitle = van10.derive(() => {
    const title = steps[stepIndex.val].title;
    return typeof title === "object" ? title.val : title;
  });
  const stepLine = van10.derive(
    () => raw("wizard.step", "Paso {actual} de {total}", {
      actual: stepIndex.val + 1,
      total: steps.length
    })
  );
  const indicators = van10.derive(
    () => div7(
      { class: "flex flex-wrap gap-2 mb-4" },
      steps.map((s, i) => {
        const done = i < stepIndex.val;
        const active = i === stepIndex.val;
        return div7(
          {
            class: "text-xs px-3 py-1 rounded-full border " + (active ? "border-accent bg-accent/10 text-accent" : done ? "border-border text-foreground-soft" : "border-border text-foreground-soft opacity-60")
          },
          `${i + 1}. `,
          s.title
        );
      })
    )
  );
  const stepView = van10.derive(
    () => div7(
      { class: "wizard-step space-y-3" },
      ...(steps[stepIndex.val].fields ?? []).map((f) => f.dom()),
      ...steps[stepIndex.val].content ?? []
    )
  );
  const footer = van10.derive(() => {
    const isLast = stepIndex.val === steps.length - 1;
    const controls = [];
    if (stepIndex.val > 0) {
      controls.push(
        Button(
          { type: "button", variant: "secondary", class: "w-auto px-4", onclick: back },
          t("wizard.back", "Atr\xE1s")
        )
      );
    }
    controls.push(
      Button(
        {
          type: "button",
          class: "w-auto px-4",
          disabled: submitting.val,
          onclick: isLast ? submit : next
        },
        isLast ? t("wizard.submit", "Enviar") : t("wizard.next", "Siguiente")
      )
    );
    return div7({ class: "flex justify-between pt-4 gap-2" }, ...controls);
  });
  return {
    dom() {
      return div7(
        { class: "space-y-4" },
        () => indicators.val,
        div7(
          { class: "flex items-center justify-between flex-wrap gap-2" },
          h3({ class: "text-lg font-semibold text-foreground" }, () => stepLine.val),
          div7({ class: "text-sm text-foreground-soft" }, () => currentTitle.val)
        ),
        div7({ class: "wizard-body" }, () => stepView.val),
        () => error.val ? p2({ class: "text-destructive text-sm" }, error.val) : "",
        () => footer.val
      );
    },
    get step() {
      return stepIndex;
    },
    get store() {
      return store;
    },
    get submitting() {
      return submitting;
    },
    get error() {
      return error;
    },
    next,
    back,
    goTo,
    collectStep,
    validateCurrent
  };
};

// src/components/modal.ts
import van11 from "vanjs-core";
var zone = (v) => {
  if (v === null || v === void 0) return null;
  return typeof v === "function" ? v : () => v;
};
var ModalBase = (initialContent = null, initialVisible = false) => {
  const header = van11.state(null);
  const body = van11.state(null);
  const footer = van11.state(null);
  const isVisible = van11.state(initialVisible);
  const setHeader = (newHeader = null) => header.val = zone(newHeader);
  const setBody = (newBody = null) => body.val = zone(newBody);
  const setFooter = (newFooter = null) => footer.val = zone(newFooter);
  const open = () => isVisible.val = true;
  const close = () => isVisible.val = false;
  const set = (input3, show = false) => {
    if ("header" in input3) setHeader(input3.header);
    if ("body" in input3) setBody(input3.body);
    if ("footer" in input3) setFooter(input3.footer);
    if (show) open();
  };
  if (initialContent) set(initialContent);
  const div7 = van11.tags.div;
  const render = () => div7(
    {
      class: () => isVisible.val ? "fixed inset-0 flex items-center justify-center bg-overlay z-50 p-4" : "hidden",
      role: "dialog",
      "aria-modal": "true",
      onclick: (e) => e.target === e.currentTarget && close()
    },
    div7(
      {
        class: "bg-background rounded-lg shadow-xl p-6 w-full max-w-md",
        onclick: (e) => e.stopPropagation()
      },
      () => header.val ? header.val() : div7(),
      () => body.val ? body.val() : div7(),
      () => footer.val ? footer.val() : div7()
    )
  );
  const mount = (container = document.body) => container.appendChild(render());
  return {
    open,
    close,
    setHeader,
    setBody,
    setFooter,
    set,
    mount,
    isVisible,
    render,
    dom: render
  };
};
var ModalTitle = (title) => van11.tags.div({ class: "text-xl font-bold text-accent" }, title);
var ModalClose = (onClose) => van11.tags.button(
  {
    type: "button",
    class: "text-2xl text-muted hover:text-foreground-soft bg-transparent border-none cursor-pointer p-0",
    "aria-label": t("modal.close", "Cerrar"),
    onclick: onClose
  },
  "\xD7"
);
var ModalHeaderWithTitleAndClose = (title, onClose) => van11.tags.div(
  { class: "flex justify-between items-center pb-3" },
  ModalTitle(title),
  ModalClose(onClose)
);
var ModalFooterWithCloseButton = (onClose, text = t("modal.close", "Cerrar")) => van11.tags.div(
  { class: "pt-3 flex justify-end gap-2" },
  SecondaryButton({ onclick: onClose }, text)
);
var Modal = (initialContent = null, initialVisible = false) => {
  const title = van11.state(
    initialContent?.title
  );
  const header = () => ModalHeaderWithTitleAndClose(title.val ?? "", () => modal.close());
  const footer = () => ModalFooterWithCloseButton(() => modal.close());
  const modal = ModalBase(
    {
      header: initialContent?.header ?? header,
      footer: initialContent?.footer !== void 0 ? initialContent.footer : footer,
      body: initialContent?.body
    },
    initialVisible
  );
  const setTitle = (newTitle) => title.val = newTitle;
  const set = (input3, show = false) => {
    const next = { ...input3 };
    if (!("footer" in next)) next.footer = footer;
    if (input3.title !== void 0) setTitle(input3.title);
    modal.set(next, show);
  };
  return { ...modal, setTitle, set };
};

// src/components/spin.ts
import van12 from "vanjs-core";
var Spin = (msg = "") => {
  const { div: div7 } = van12.tags;
  return div7(
    { class: "flex flex-col items-center justify-center py-8" },
    div7({
      class: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent mb-3"
    }),
    msg ? div7({ class: "text-base text-foreground-soft" }, msg) : null
  );
};

// src/components/spin-modal.ts
var SpinModal = (msg) => ({
  body: () => Spin(msg),
  footer: null
});

// src/components/nav.ts
import van14 from "vanjs-core";

// src/router.ts
import van13 from "vanjs-core";
var { div } = van13.tags;
function compile(path2) {
  const keys = [];
  const source = path2.split("/").map((seg) => {
    if (seg.startsWith(":")) {
      keys.push(seg.slice(1));
      return "([^/]+)";
    }
    return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("/");
  return { regex: new RegExp(`^${source}/?$`), keys };
}
var Router = class {
  routes = [];
  redirects = /* @__PURE__ */ new Map();
  notFound = () => div(t("router.notFound", "404 - No encontrado"));
  defaultGuard;
  publicRoutes;
  /** Nodo reactivo de la vista actual — monta con `van.add(root, router.current)` o vía `start()`. */
  current = van13.state(div(t("router.loading", "Cargando...")));
  /** Ruta actual (reactiva) — el Nav la lee para resaltar el link activo. */
  path = van13.state("/");
  constructor(options = {}) {
    this.defaultGuard = options.guard;
    this.publicRoutes = options.publicRoutes ?? [];
    if (!activeRouter) {
      activeRouter = this;
    }
  }
  /** ¿`pathname` es pública según `publicRoutes`? (exacto, wildcard "/x/*" o RegExp) */
  isPublic(pathname) {
    return this.publicRoutes.some((p2) => {
      if (p2 instanceof RegExp) return p2.test(pathname);
      if (p2.endsWith("/*")) return pathname === p2.slice(0, -2) || pathname.startsWith(p2.slice(0, -1));
      return p2 === pathname;
    });
  }
  /** Registra una ruta. `path` acepta segmentos `:param`. */
  add(path2, factory, options = {}) {
    this.routes.push({ path: path2, ...compile(path2), factory, ...options });
    return this;
  }
  /** Registra una redirección: al navegar a `from` va directo a `to`. */
  redirect(from, to) {
    this.redirects.set(from, to);
    return this;
  }
  /** Factory para rutas sin match. */
  setNotFound(factory) {
    this.notFound = factory;
    return this;
  }
  /** Navega a `path` (pushState o replaceState) y resuelve. Devuelve la resolución (para tests). */
  async navigate(path2, options) {
    if (path2 === (window.location.pathname || "/")) return;
    if (options?.replace) {
      window.history.replaceState({}, "", path2);
    } else {
      window.history.pushState({}, "", path2);
    }
    await this.doResolve();
  }
  /** Re-resuelve la ruta actual (útil en tests y tras cambios de estado). */
  resolve() {
    void this.doResolve();
  }
  /**
   * Navegación "de sistema" — LA única puerta para redirects. La ruta de
   * origen nunca llegó a renderizarse (alias de `.redirect()`, verdict de
   * un guard), así que REEMPLAZA su entrada del historial en vez de apilar:
   * solo la navegación iniciada por el usuario (Link, spaClick, navigate)
   * apila. Cualquier redirect futuro del router debe pasar por aquí — nunca
   * llamar `navigate(target, { replace: true })` a mano.
   */
  async systemRedirect(target) {
    await this.navigate(target, { replace: true });
  }
  /** Busca la ruta que matchea `pathname` y la renderiza (aplica guard/redirect/notFound). */
  async doResolve(href) {
    const to = href ?? (window.location.pathname || "/");
    const redirectTo = this.redirects.get(to);
    if (redirectTo) {
      await this.systemRedirect(redirectTo);
      return;
    }
    this.path.val = to;
    for (const route of this.routes) {
      const m = to.match(route.regex);
      if (!m) continue;
      const params = {};
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(m[i + 1]);
      });
      const ctx = {
        to,
        params,
        navigate: (p2) => void this.navigate(p2)
      };
      const guards = [];
      if (this.defaultGuard && !this.isPublic(to)) guards.push(this.defaultGuard);
      if (route.beforeEnter) guards.push(route.beforeEnter);
      for (const guard of guards) {
        const verdict = await guard(ctx);
        if (typeof verdict === "string" && verdict !== to) {
          await this.systemRedirect(verdict);
          return;
        }
        if (verdict === false) return;
      }
      this.current.val = route.factory(ctx);
      route.afterEnter?.(ctx);
      return;
    }
    this.current.val = this.notFound({ to, params: {}, navigate: (p2) => void this.navigate(p2) });
  }
  /**
   * Instala listeners (popstate + intercepción de clicks en `<a>` internos)
   * y resuelve la ruta inicial. Devuelve un binding para montar con `van.add`.
   *
   * Los listeners son globales y únicos: delegan al router activo, así que
   * llamar `start()` en varias instancias (HMR, tests) no acumula handlers
   * que compitan por la misma navegación.
   */
  start() {
    activeRouter = this;
    if (!popstateHandler) {
      popstateHandler = () => activeRouter?.resolve();
      window.addEventListener("popstate", popstateHandler);
    }
    if (!clickHandler) {
      clickHandler = (e) => {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!(e.target instanceof Element)) return;
        const target = e.target.closest("a");
        if (target && !target.hasAttribute("target") && target.origin === window.location.origin && !target.hasAttribute("data-native")) {
          e.preventDefault();
          void activeRouter?.navigate(target.pathname);
        }
      };
      document.addEventListener("click", clickHandler);
    }
    this.resolve();
    return () => this.current.val;
  }
};
var popstateHandler = null;
var clickHandler = null;
var activeRouter = null;
function setActiveRouter(router) {
  activeRouter = router;
}
function getActiveRouter() {
  return activeRouter;
}
async function navigate(path2, options) {
  if (activeRouter) {
    await activeRouter.navigate(path2, options);
  } else {
    if (options?.replace) {
      window.history.replaceState({}, "", path2);
    } else {
      window.history.pushState({}, "", path2);
    }
  }
}
function spaClick(e, href, options = {}) {
  if (e.defaultPrevented || options.external || options.target || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return;
  }
  e.preventDefault();
  void navigate(href, { replace: options.replace });
}
function createRouter(options = {}) {
  const router = new Router(options);
  activeRouter = router;
  return router;
}

// src/components/nav.ts
var linkVariantClasses = {
  default: "text-foreground hover:underline font-medium",
  muted: "text-foreground-soft hover:text-foreground hover:underline",
  accent: "text-accent hover:text-accent-hover hover:underline font-medium cursor-pointer",
  // Misma apariencia que Button (variante primary, tamaño md), sobre un <a>.
  button: cx(
    "inline-flex items-center justify-center rounded-md border border-transparent font-semibold transition duration-200 ease-in-out cursor-pointer",
    VARIANT_CLASSES.primary,
    SIZE_CLASSES.md
  ),
  // Sin clases base: para consumidores que aportan el estilo completo
  // (p. ej. Nav con su estado activo) y siguen queriendo el plumbing de Link.
  none: ""
};
function Link(props, ...children) {
  const { a } = van14.tags;
  const {
    href,
    class: customClass = "",
    variant = "accent",
    replace = false,
    external = false,
    target,
    rel,
    title,
    download,
    onclick,
    ...rest
  } = props;
  return a(
    {
      href,
      class: cx(linkVariantClasses[variant], customClass),
      // Claves presentes solo con valor: van escribiría attrs "undefined".
      ...target ? { target } : {},
      // Los enlaces que abren pestaña nueva no delegan window.opener.
      ...target === "_blank" && !rel ? { rel: "noopener noreferrer" } : rel ? { rel } : {},
      ...title ? { title } : {},
      ...download ? { download } : {},
      onclick: (e) => {
        if (onclick) onclick(e);
        spaClick(e, href, { replace, external, target });
      },
      ...rest
    },
    ...children
  );
}
var Nav = (links, props) => {
  const { nav: nav2 } = van14.tags;
  const { current, ariaLabel, class: extra } = props;
  const resolvedLabel = ariaLabel ?? t("nav.ariaLabel", "Navegaci\xF3n principal");
  const getCurrent = () => typeof current === "object" && current !== null && "val" in current ? current.val : current;
  return nav2(
    {
      class: cx("flex flex-wrap items-center gap-x-4 gap-y-1", extra),
      "aria-label": () => typeof resolvedLabel === "object" && "val" in resolvedLabel ? resolvedLabel.val : resolvedLabel
    },
    links.map(
      (link) => (
        // Re-render por link (mismo idioma que SidebarItem): clase activa y
        // aria-current se escriben de forma atómica, sin derivaciones que
        // sobrevivan al desmonte del árbol. Los anchors son Link (variante
        // "none" + estilo propio): mismo plumbing de navegación para todos.
        () => {
          const isActive = isRouteActive(getCurrent(), link.href);
          return Link(
            {
              href: link.href,
              variant: "none",
              class: cx(
                "text-accent no-underline text-[0.9rem] hover:underline transition-colors cursor-pointer",
                isActive && "font-bold"
              ),
              ...isActive ? { "aria-current": "page" } : {}
            },
            link.label
          );
        }
      )
    )
  );
};

// src/components/icon.ts
var PATHS = {
  sun: [
    "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M12 2v2",
    "M12 20v2",
    "m4.93 4.93 1.41 1.41",
    "m17.66 17.66 1.41 1.41",
    "M2 12h2",
    "M20 12h2",
    "m6.34 17.66-1.41 1.41",
    "m19.07 4.93-1.41 1.41"
  ],
  moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  monitor: [
    "M20 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z",
    "M8 21h8",
    "M12 17v4"
  ],
  "chevron-left": ["M15 18l-6-6 6-6"],
  "chevron-right": ["m9 18 6-6-6-6"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  check: ["M20 6 9 17l-5-5"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  search: [
    "m21 21-4.34-4.34",
    "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
  ],
  globe: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "M2 12h20",
    "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"
  ],
  "credit-card": [
    "M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z",
    "M2 12h20"
  ],
  puzzle: [
    "M10.5 2h3a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-1A1.5 1.5 0 0 1 10.5 2Z",
    "M19.5 13.5v-3a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1A1.5 1.5 0 0 0 14 6h-3",
    "M19.5 13.5a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 0-1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-3",
    "M13.5 19.5h-3a1.5 1.5 0 0 1-1.5-1.5v-1a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-3",
    "M2 10.5v-3a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 0 1.5-1.5v-1A1.5 1.5 0 0 1 7.5 2h3",
    "M10.5 2H7.5"
  ],
  key: [
    "m21 2-2 2",
    "m19 4-2 2",
    "m17 6-2 2",
    "m15 8-2 2",
    "m13 10-1.61 1.61",
    "M7.5 15.5a5.5 5.5 0 1 1 7.778-7.778 5.5 5.5 0 0 1-7.777 7.777Z",
    "m6 18-1 1",
    "m7 17-1 1",
    "m9 19-2 2",
    "m11 21-1 1"
  ],
  "log-out": [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "m16 17 5-5-5-5",
    "M21 12H9"
  ],
  info: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "M12 16v-4",
    "M12 8h.01"
  ],
  "alert-triangle": [
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2Z",
    "M12 9v4",
    "M12 17h.01"
  ],
  bell: [
    "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
    "M10.3 21a1.94 1.94 0 0 0 3.4 0"
  ],
  question: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    "M12 17h.01"
  ],
  "check-circle": [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "m9 12 2 2 4-4"
  ],
  "x-circle": [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "m15 9-6 6",
    "m9 9 6 6"
  ],
  trash: [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "M10 11v6",
    "M14 11v6"
  ],
  inbox: [
    "M22 12h-6l-2 3h-4l-2-3H2",
    "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"
  ],
  smartphone: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M9 18h6"
  ],
  rocket: [
    "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z",
    "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z",
    "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",
    "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
  ],
  navigation: ["M3 11 22 2l-9 19-2-8-8-2Z"],
  user: [
    "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
    "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
  ],
  settings: [
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
  ],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"]
};
function Icon(props) {
  return Svg(
    {
      viewBox: "0 0 24 24",
      style: "fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round",
      class: () => cx(
        "shrink-0 select-none size-4",
        typeof props.class === "function" ? props.class() : typeof props.class === "object" && props.class !== null && "val" in props.class ? props.class.val : props.class
      ),
      "aria-hidden": "true"
    },
    ...PATHS[props.name].map((d) => SvgPath({ d }))
  );
}

// src/components/badge.ts
import van15 from "vanjs-core";
var { span } = van15.tags;
function Badge(props) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";
  const variantStyles = {
    primary: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    secondary: "bg-slate-700/50 text-slate-300 border border-slate-600/30",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    outline: "bg-transparent text-slate-300 border border-slate-600"
  };
  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1"
  };
  const dotColors = {
    primary: "bg-blue-400",
    secondary: "bg-slate-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    outline: "bg-slate-400"
  };
  return span(
    {
      ...props.id ? { id: props.id } : {},
      class: `inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${props.class ?? ""}`
    },
    props.dot ? span({
      class: `w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`
    }) : null,
    props.text !== void 0 ? props.text : null,
    props.children
  );
}

// src/components/table.ts
import van16 from "vanjs-core";
var { div: div2, table, thead, tbody, tr, th, td, span: span2, button, input } = van16.tags;
function Table(props) {
  const currentPage = van16.state(1);
  const sortKey = van16.state(null);
  const sortDirection = van16.state("asc");
  const searchQuery = van16.state("");
  const internalSelected = van16.state([]);
  const selectedRows = props.selectedRows ?? internalSelected;
  const getData = () => {
    return Array.isArray(props.data) ? props.data : props.data.val;
  };
  const getKey = (row, index) => {
    if (props.keyField && row[props.keyField] !== void 0) {
      return row[props.keyField];
    }
    return row.id ?? index;
  };
  const handleSort = (key) => {
    if (sortKey.val === key) {
      sortDirection.val = sortDirection.val === "asc" ? "desc" : "asc";
    } else {
      sortKey.val = key;
      sortDirection.val = "asc";
    }
  };
  const toggleSelectRow = (row) => {
    const key = props.keyField ?? "id";
    const current = [...selectedRows.val];
    const existsIdx = current.findIndex(
      (r) => key in r && key in row ? r[key] === row[key] : r === row
    );
    if (existsIdx >= 0) {
      current.splice(existsIdx, 1);
    } else {
      current.push(row);
    }
    selectedRows.val = current;
    props.onSelectionChange?.(current);
  };
  const toggleSelectAll = (displayRows) => {
    const key = props.keyField ?? "id";
    const allSelected = displayRows.every(
      (row) => selectedRows.val.some(
        (r) => key in r && key in row ? r[key] === row[key] : r === row
      )
    );
    if (allSelected) {
      const current = selectedRows.val.filter(
        (r) => !displayRows.some(
          (dr) => key in r && key in dr ? r[key] === dr[key] : r === dr
        )
      );
      selectedRows.val = current;
      props.onSelectionChange?.(current);
    } else {
      const current = [...selectedRows.val];
      for (const dr of displayRows) {
        if (!current.some(
          (r) => key in r && key in dr ? r[key] === dr[key] : r === dr
        )) {
          current.push(dr);
        }
      }
      selectedRows.val = current;
      props.onSelectionChange?.(current);
    }
  };
  return div2(
    {
      ...props.id ? { id: props.id } : {},
      class: `w-full rounded-xl border border-border bg-background shadow-sm overflow-hidden ${props.class ?? ""}`
    },
    () => {
      let rows = [...getData()];
      if (props.searchable && searchQuery.val.trim()) {
        const q = searchQuery.val.toLowerCase();
        rows = rows.filter(
          (row) => props.columns.some((col) => {
            const val = row[col.key];
            return val !== void 0 && val !== null && String(val).toLowerCase().includes(q);
          })
        );
      }
      if (sortKey.val) {
        const key = sortKey.val;
        const colDef = props.columns.find((c) => c.key === key);
        const dir = sortDirection.val === "asc" ? 1 : -1;
        if (colDef?.compare) {
          const comp = colDef.compare;
          rows.sort((a, b) => comp(a, b) * dir);
        } else {
          rows.sort((a, b) => {
            const valA = a[key];
            const valB = b[key];
            if (valA === valB) return 0;
            if (valA === void 0 || valA === null) return 1;
            if (valB === void 0 || valB === null) return -1;
            if (typeof valA === "number" && typeof valB === "number") {
              return (valA - valB) * dir;
            }
            return String(valA).localeCompare(String(valB)) * dir;
          });
        }
      }
      const totalItems = rows.length;
      const pageSize = props.pageSize ?? 0;
      let totalPages = 1;
      let displayRows = rows;
      if (pageSize > 0) {
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (currentPage.val > totalPages) currentPage.val = totalPages;
        const start = (currentPage.val - 1) * pageSize;
        displayRows = rows.slice(start, start + pageSize);
      }
      const isAllSelected = displayRows.length > 0 && displayRows.every((row) => {
        const key = props.keyField ?? "id";
        return selectedRows.val.some(
          (r) => key in r && key in row ? r[key] === row[key] : r === row
        );
      });
      return div2(
        { class: "flex flex-col w-full" },
        // Barra de búsqueda superior (si searchable = true)
        props.searchable ? div2(
          {
            class: "flex items-center justify-between gap-3 p-3.5 border-b border-border bg-secondary/5"
          },
          div2(
            { class: "relative flex-1 max-w-sm" },
            input({
              type: "text",
              placeholder: props.searchPlaceholder ?? t("table.searchPlaceholder", "Buscar en la tabla..."),
              value: searchQuery.val,
              class: "w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-focus transition-all",
              oninput: (e) => {
                searchQuery.val = e.target.value;
                currentPage.val = 1;
              }
            }),
            span2(
              { class: "absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" },
              Icon({ name: "search", class: "size-3.5" })
            )
          ),
          props.selectable && selectedRows.val.length > 0 ? span2(
            { class: "text-xs text-primary font-semibold" },
            t("table.selectedCount", `${selectedRows.val.length} seleccionados`, { count: selectedRows.val.length })
          ) : null
        ) : null,
        // Tabla con scroll horizontal responsivo
        div2(
          { class: "w-full overflow-x-auto" },
          table(
            { class: "w-full text-left text-sm border-collapse" },
            thead(
              {
                class: "border-b border-border bg-secondary/15 text-foreground-soft text-xs font-semibold uppercase tracking-wider"
              },
              tr(
                props.selectable ? th(
                  { class: "w-10 px-4 py-3.5 text-center" },
                  input({
                    type: "checkbox",
                    checked: isAllSelected,
                    class: "rounded border-border text-primary cursor-pointer",
                    onchange: () => toggleSelectAll(displayRows)
                  })
                ) : null,
                props.columns.map((col) => {
                  const alignClass = col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";
                  return th(
                    {
                      class: `px-4 py-3.5 ${alignClass} ${col.sortable ? "cursor-pointer select-none hover:text-foreground hover:bg-secondary/15 transition-colors" : ""}`,
                      ...col.width ? { style: `width: ${col.width}` } : {},
                      ...col.sortable ? { onclick: () => handleSort(col.key) } : {}
                    },
                    div2(
                      {
                        class: `inline-flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`
                      },
                      span2(col.header),
                      col.sortable ? span2(
                        {
                          class: `text-xs font-mono transition-colors ${sortKey.val === col.key ? "text-primary font-bold" : "text-muted"}`
                        },
                        sortKey.val === col.key ? sortDirection.val === "asc" ? "\u25B2" : "\u25BC" : "\u21C5"
                      ) : null
                    )
                  );
                })
              )
            ),
            tbody(
              { class: "divide-y divide-border text-foreground" },
              displayRows.length === 0 ? tr(
                td(
                  {
                    colspan: props.columns.length + (props.selectable ? 1 : 0),
                    class: "px-4 py-8 text-center text-muted text-sm italic"
                  },
                  props.emptyText ?? t("table.emptyText", "No hay datos disponibles")
                )
              ) : displayRows.map((row, index) => {
                const key = props.keyField ?? "id";
                const isSelected = selectedRows.val.some(
                  (r) => key in r && key in row ? r[key] === row[key] : r === row
                );
                return tr(
                  {
                    key: getKey(row, index),
                    class: `transition-colors ${isSelected ? "bg-primary/10 hover:bg-primary/15 font-medium" : "hover:bg-secondary/10"}`
                  },
                  props.selectable ? td(
                    { class: "w-10 px-4 py-3.5 text-center" },
                    input({
                      type: "checkbox",
                      checked: isSelected,
                      class: "rounded border-border text-primary cursor-pointer",
                      onchange: () => toggleSelectRow(row)
                    })
                  ) : null,
                  props.columns.map((col) => {
                    const alignClass = col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";
                    return td(
                      { class: `px-4 py-3.5 ${alignClass}` },
                      col.render ? col.render(row, index) : row[col.key] ?? "-"
                    );
                  })
                );
              })
            )
          )
        ),
        // Paginación
        pageSize > 0 && totalItems > 0 ? div2(
          {
            class: "flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border text-xs text-foreground-soft bg-secondary/5"
          },
          span2(
            () => raw("table.showing", "Mostrando {start} - {end} de {total}", {
              start: (currentPage.val - 1) * pageSize + 1,
              end: Math.min(currentPage.val * pageSize, totalItems),
              total: totalItems
            })
          ),
          div2(
            { class: "flex items-center gap-1.5" },
            button(
              {
                type: "button",
                disabled: () => currentPage.val <= 1,
                class: "px-2.5 py-1 rounded-md border border-border bg-background hover:bg-secondary/20 disabled:opacity-40 disabled:pointer-events-none text-foreground transition-colors cursor-pointer",
                onclick: () => currentPage.val = Math.max(1, currentPage.val - 1)
              },
              t("table.prev", "\u2190 Anterior")
            ),
            span2(
              { class: "px-2 font-medium text-foreground" },
              () => `${currentPage.val} / ${totalPages}`
            ),
            button(
              {
                type: "button",
                disabled: () => currentPage.val >= totalPages,
                class: "px-2.5 py-1 rounded-md border border-border bg-background hover:bg-secondary/20 disabled:opacity-40 disabled:pointer-events-none text-foreground transition-colors cursor-pointer",
                onclick: () => currentPage.val = Math.min(totalPages, currentPage.val + 1)
              },
              t("table.next", "Siguiente \u2192")
            )
          )
        ) : null
      );
    }
  );
}
var DataGrid = Table;

// src/components/tabs.ts
import van17 from "vanjs-core";
var { div: div3, nav, button: button2, span: span3 } = van17.tags;
function Tabs(props) {
  const items = props.items;
  const initialTab = props.defaultTab ?? props.activeTab?.val ?? (items.length > 0 ? items[0].id : "");
  const activeTab = props.activeTab ?? van17.state(initialTab);
  const variant = props.variant ?? "underline";
  const handleTabClick = (item) => {
    if (item.disabled) return;
    activeTab.val = item.id;
    props.onChange?.(item.id);
  };
  const handleKeyDown = (e, currentIndex) => {
    const enabledItems = items.filter((it) => !it.disabled);
    if (enabledItems.length === 0) return;
    let targetItem;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const currentPos = enabledItems.findIndex((it) => it.id === items[currentIndex].id);
      const nextPos = (currentPos + 1) % enabledItems.length;
      targetItem = enabledItems[nextPos];
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const currentPos = enabledItems.findIndex((it) => it.id === items[currentIndex].id);
      const prevPos = (currentPos - 1 + enabledItems.length) % enabledItems.length;
      targetItem = enabledItems[prevPos];
    } else if (e.key === "Home") {
      e.preventDefault();
      targetItem = enabledItems[0];
    } else if (e.key === "End") {
      e.preventDefault();
      targetItem = enabledItems[enabledItems.length - 1];
    }
    if (targetItem) {
      handleTabClick(targetItem);
      const targetBtn = document.getElementById(`tab-btn-${props.id ?? "vui"}-${targetItem.id}`);
      targetBtn?.focus();
    }
  };
  const getTabNavClasses = () => {
    switch (variant) {
      case "pills":
        return "flex flex-wrap items-center gap-1.5 p-1 bg-secondary/15 rounded-xl";
      case "boxed":
        return "flex flex-wrap items-center gap-2 border-b border-border pb-2";
      case "underline":
      default:
        return "flex flex-wrap items-center gap-2 border-b border-border";
    }
  };
  const getTabButtonClasses = (item, isActive) => {
    const base = "inline-flex items-center gap-2 font-medium text-sm transition-all outline-none cursor-pointer select-none";
    if (item.disabled) {
      return `${base} opacity-40 cursor-not-allowed text-muted px-3 py-2`;
    }
    if (variant === "pills") {
      return `${base} px-3.5 py-1.5 rounded-lg ${isActive ? "bg-background text-foreground shadow-sm font-semibold" : "text-foreground-soft hover:text-foreground hover:bg-background/50"}`;
    }
    if (variant === "boxed") {
      return `${base} px-3.5 py-2 rounded-lg border ${isActive ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border text-foreground-soft hover:text-foreground hover:bg-secondary/10"}`;
    }
    return `${base} px-3.5 py-2.5 -mb-px border-b-2 ${isActive ? "border-primary text-primary font-semibold" : "border-transparent text-foreground-soft hover:text-foreground hover:border-border"}`;
  };
  return div3(
    {
      ...props.id ? { id: props.id } : {},
      class: `w-full flex flex-col ${props.class ?? ""}`
    },
    // Tablist
    nav(
      {
        role: "tablist",
        class: `${getTabNavClasses()} ${props.tabsClass ?? ""}`
      },
      items.map((item, index) => {
        const tabId = `tab-btn-${props.id ?? "vui"}-${item.id}`;
        const panelId = `tab-panel-${props.id ?? "vui"}-${item.id}`;
        return button2(
          {
            id: tabId,
            role: "tab",
            type: "button",
            "aria-selected": () => activeTab.val === item.id ? "true" : "false",
            "aria-controls": panelId,
            ...item.disabled ? { "aria-disabled": "true" } : {},
            tabIndex: () => activeTab.val === item.id ? 0 : -1,
            ...item.disabled ? { disabled: true } : {},
            class: () => getTabButtonClasses(item, activeTab.val === item.id),
            onclick: () => handleTabClick(item),
            onkeydown: (e) => handleKeyDown(e, index)
          },
          item.icon ?? null,
          span3(item.label),
          item.badge !== void 0 ? span3(
            {
              class: "text-xs px-1.5 py-0.5 rounded-full font-mono bg-secondary/30 text-foreground-soft"
            },
            item.badge
          ) : null
        );
      })
    ),
    // Panels
    div3(
      {
        class: `pt-4 ${props.contentClass ?? ""}`
      },
      items.map((item) => {
        const tabId = `tab-btn-${props.id ?? "vui"}-${item.id}`;
        const panelId = `tab-panel-${props.id ?? "vui"}-${item.id}`;
        return () => {
          const isActive = activeTab.val === item.id;
          if (!isActive) return span3({ class: "hidden" });
          return div3(
            {
              id: panelId,
              role: "tabpanel",
              "aria-labelledby": tabId,
              tabIndex: 0,
              class: "outline-none focus:ring-1 focus:ring-focus rounded-lg"
            },
            item.content()
          );
        };
      })
    )
  );
}

// src/components/layout.ts
import van18 from "vanjs-core";
var TEXTS2 = {
  collapse: { key: "sidebar.collapse", default: "Colapsar barra lateral" },
  expand: { key: "sidebar.expand", default: "Expandir barra lateral" },
  close: { key: "sidebar.close", default: "Cerrar men\xFA" },
  title: { key: "sidebar.title", default: "Sidebar" },
  resize: { key: "sidebar.resize", default: "Ajustar ancho de la barra lateral" }
};
function SidebarItem(props) {
  const { a, button: button5, span: span7, div: div7 } = van18.tags;
  const tag = props.href ? a : button5;
  const isCurrentActive = () => {
    if (typeof props.active === "boolean") return props.active;
    if (typeof props.active === "function") return props.active();
    if (props.active && "val" in props.active) return props.active.val;
    if (props.href && props.current) {
      const cur = typeof props.current === "string" ? props.current : props.current.val;
      return isRouteActive(cur, props.href);
    }
    return false;
  };
  const renderIcon = () => {
    if (!props.icon) return null;
    if (typeof props.icon === "string") {
      return span7({ class: "text-lg shrink-0 flex items-center justify-center w-6 h-6 select-none" }, props.icon);
    }
    if (typeof props.icon === "function") {
      return span7({ class: "shrink-0 flex items-center justify-center w-6 h-6" }, props.icon());
    }
    return span7({ class: "shrink-0 flex items-center justify-center w-6 h-6" }, props.icon);
  };
  const renderBadge = () => {
    if (props.badge === void 0 || props.badge === null) return null;
    const badgeNode = typeof props.badge === "string" || typeof props.badge === "number" ? Badge({ text: props.badge, variant: props.badgeVariant ?? "primary", size: "sm" }) : typeof props.badge === "object" && "val" in props.badge ? () => Badge({ text: props.badge?.val, variant: props.badgeVariant ?? "primary", size: "sm" }) : props.badge;
    return van18.tags.span({ class: "vui-sb-badge shrink-0" }, badgeNode);
  };
  const labelText = typeof props.label === "string" ? props.label : null;
  return () => {
    const isActive = isCurrentActive();
    return tag(
      {
        // Van no acepta `undefined` como valor de prop: con el setter del DOM
        // terminaría como attr `href="undefined"`. Omitir la clave por rama.
        ...props.href ? { href: props.href } : { type: "button" },
        // Nombre accesible estable aunque el modo rail oculte el texto visible.
        ...labelText ? { "aria-label": labelText } : {},
        class: cx(
          "vui-sb-item w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all no-underline cursor-pointer select-none text-left border border-transparent",
          isActive ? "bg-primary text-primary-fg font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
          props.class
        ),
        ...isActive ? { "aria-current": "page" } : {},
        onclick: (e) => {
          if (props.onclick) props.onclick(e);
          if (props.href) spaClick(e, props.href);
        }
      },
      div7(
        { class: "flex items-center gap-3 min-w-0" },
        renderIcon(),
        span7({ class: "vui-sb-label truncate" }, props.label)
      ),
      renderBadge()
    );
  };
}
function SidebarGroup(props, ...children) {
  const { div: div7, h3 } = van18.tags;
  return div7(
    { class: cx("flex flex-col gap-1 py-2", props.class) },
    props.title ? h3(
      {
        class: "vui-sb-group-title px-3.5 pb-1 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider select-none"
      },
      props.title
    ) : null,
    children
  );
}
function Sidebar(props) {
  const { aside, div: div7, button: button5, span: span7 } = van18.tags;
  let collapsed;
  if (props.collapsed) {
    collapsed = props.collapsed;
    if (props.storageKey && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(props.storageKey);
      if (saved != null) collapsed.val = saved === "1";
      van18.derive(() => {
        localStorage.setItem(props.storageKey, collapsed.val ? "1" : "0");
      });
    }
  } else {
    const storageKey = props.storageKey ?? "vanuikit-sidebar-collapsed";
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(storageKey) : null;
    collapsed = van18.state(saved === "1");
    van18.derive(() => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, collapsed.val ? "1" : "0");
      }
    });
  }
  const minW = props.minWidth ?? 224;
  const maxW = props.maxWidth ?? 384;
  const widthStorageKey = props.widthStorageKey ?? "vanuikit-sidebar-width";
  const initialWidth = props.resizable ? (() => {
    const savedRaw = typeof localStorage !== "undefined" ? localStorage.getItem(widthStorageKey) : null;
    const saved = savedRaw != null ? Number(savedRaw) : NaN;
    return Number.isFinite(saved) ? Math.min(maxW, Math.max(minW, saved)) : props.defaultWidth ?? 256;
  })() : 256;
  const width = van18.state(initialWidth);
  if (props.resizable) {
    van18.derive(() => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(widthStorageKey, String(Math.round(width.val)));
      }
    });
  }
  const dragging = van18.state(false);
  const startResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width.val;
    dragging.val = true;
    const onMove = (ev) => {
      width.val = Math.min(maxW, Math.max(minW, startW + ev.clientX - startX));
    };
    const onUp = () => {
      dragging.val = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  const resizer = props.resizable ? div7({
    class: van18.derive(
      () => cx(
        "vui-sb-resizer absolute top-0 bottom-0 right-0 w-1.5 cursor-col-resize touch-none select-none hidden lg:block",
        collapsed.val && "hidden",
        dragging.val && "bg-primary/40"
      )
    ),
    role: "separator",
    "aria-orientation": "vertical",
    "aria-label": () => raw(TEXTS2.resize.key, TEXTS2.resize.default),
    "aria-valuenow": () => Math.round(width.val),
    "aria-valuemin": minW,
    "aria-valuemax": maxW,
    tabindex: 0,
    onpointerdown: startResize,
    onkeydown: (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        width.val = Math.min(maxW, Math.max(minW, width.val + (e.key === "ArrowRight" ? 16 : -16)));
      }
    }
  }) : null;
  const railClass = () => collapsed.val ? (
    // Modo rail SOLO desktop (lg:): en mobile el drawer siempre se abre
    // expandido, sin importar el estado de colapso de desktop.
    "lg:[&_.vui-sb-header]:hidden lg:[&_.vui-sb-group-title]:hidden lg:[&_.vui-sb-label]:hidden lg:[&_.vui-sb-badge]:hidden lg:[&_.vui-sb-item]:justify-center lg:[&_.vui-sb-item]:px-2"
  ) : "";
  const collapseToggle = props.collapsible ? button5(
    {
      type: "button",
      class: "hidden lg:inline-flex items-center justify-center size-7 rounded-lg border border-border/60 bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary-hover hover:border-border shadow-sm cursor-pointer transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
      "aria-label": () => {
        const label = collapsed.val ? TEXTS2.expand : TEXTS2.collapse;
        return raw(label.key, label.default);
      },
      "aria-expanded": () => collapsed.val ? "false" : "true",
      onclick: () => {
        collapsed.val = !collapsed.val;
      }
    },
    () => Icon({
      name: "chevron-left",
      class: () => cx("transition-transform duration-200 ease-in-out", collapsed.val && "rotate-180")
    })
  ) : null;
  return aside(
    {
      class: van18.derive(
        () => cx(
          "relative h-full flex flex-col justify-between bg-card border-r border-border text-foreground select-none w-64 p-4 transition-[width] duration-200",
          collapsed.val && "lg:w-20 lg:px-3",
          railClass(),
          props.class
        )
      ),
      // Ancho controlado por resize (inline gana a w-64; en rail colapsado se
      // omite para que mande lg:w-20). Transición desactivada durante el drag.
      style: () => props.resizable && !collapsed.val ? `width:${width.val}px${dragging.val ? ";transition:none" : ""}` : "",
      "aria-label": t("sidebar.title", "Sidebar")
    },
    // Sección superior: header + navegación (scroll interno, el footer queda fijo).
    div7(
      { class: "flex flex-col gap-4 overflow-y-auto flex-1 pr-1" },
      props.header || props.onClose || collapseToggle ? div7(
        {
          class: () => cx(
            "flex items-center gap-2 pb-3 border-b border-border/60",
            props.header ? "justify-between" : "justify-center"
          )
        },
        props.header ? div7({ class: () => cx("vui-sb-header min-w-0 flex-1", collapsed.val && "hidden") }, props.header) : null,
        props.onClose ? button5(
          {
            type: "button",
            class: "lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer",
            "aria-label": t("sidebar.close", "Cerrar men\xFA"),
            onclick: props.onClose
          },
          Icon({ name: "x" })
        ) : null,
        collapseToggle
      ) : null,
      div7(
        { class: "flex flex-col gap-1" },
        props.content
      )
    ),
    // Sección inferior: footer / perfil de usuario (siempre visible: el nav
    // scrollea internamente, la barra completa queda anclada al viewport).
    props.footer ? div7(
      {
        class: () => cx(
          "pt-4 border-t border-border/60 mt-auto",
          collapsed.val && "lg:flex lg:justify-center lg:overflow-hidden"
        )
      },
      props.footer
    ) : null,
    resizer
  );
}
function HeaderBar(props) {
  const { header, div: div7, h1 } = van18.tags;
  const renderTitle = () => {
    if (!props.title) return null;
    if (typeof props.title === "string") {
      return h1({ class: "text-base sm:text-lg font-bold text-foreground tracking-tight truncate" }, props.title);
    }
    if (typeof props.title === "function") {
      return () => {
        const val = props.title();
        if (typeof val === "string") {
          return h1({ class: "text-base sm:text-lg font-bold text-foreground tracking-tight truncate" }, val);
        }
        return val;
      };
    }
    if (typeof props.title === "object" && "val" in props.title) {
      return () => h1({ class: "text-base sm:text-lg font-bold text-foreground tracking-tight truncate" }, props.title.val);
    }
    return props.title;
  };
  return header(
    {
      class: cx(
        "sticky top-0 z-30 flex items-center justify-between gap-3 h-16 px-4 sm:px-6 bg-card/80 backdrop-blur-md border-b border-border transition-colors",
        props.class
      )
    },
    div7(
      { class: "flex items-center gap-3 min-w-0" },
      props.leading,
      renderTitle()
    ),
    div7({ class: "flex items-center gap-2 sm:gap-3" }, props.actions)
  );
}
function AppShell(props) {
  const { div: div7 } = van18.tags;
  const isOpen = props.sidebarOpen ?? van18.state(false);
  const closeSidebar = () => {
    isOpen.val = false;
  };
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onDesktop = (e) => {
      if (e.matches) isOpen.val = false;
    };
    mq.addEventListener("change", onDesktop);
  }
  return div7(
    {
      class: cx(
        // Sin overflow-x-hidden en la raíz: un ancestro con overflow != visible
        // rompe el position:sticky del sidebar en desktop (el drawer mobile es
        // fixed, no genera overflow del documento, no hace falta).
        "min-h-screen flex bg-background text-foreground transition-colors relative",
        props.class
      )
    },
    // Mobile Backdrop Drawer Overlay with smooth CSS fade transition
    div7({
      class: van18.derive(
        () => cx(
          "app-shell-backdrop fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-200",
          isOpen.val ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )
      ),
      onclick: closeSidebar,
      "aria-hidden": van18.derive(() => isOpen.val ? "false" : "true")
    }),
    // Sidebar Container (Smooth slide-in drawer on mobile, viewport-anchored
    // sticky aside on desktop lg: — h-dvh para que header/contenido/footer
    // vivan en la altura de la ventana y el footer (logout) nunca se vaya
    // al fondo del documento en páginas largas).
    div7(
      {
        class: van18.derive(
          () => cx(
            "app-shell-sidebar fixed inset-y-0 left-0 z-50 transform lg:sticky lg:top-0 lg:h-dvh lg:transform-none transition-transform duration-200 ease-in-out",
            isOpen.val ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )
        )
      },
      props.sidebar
    ),
    // Main App Area (Header + Scrollable Content + Footer)
    div7(
      { class: "flex-1 flex flex-col min-w-0 min-h-screen" },
      props.header,
      div7(
        { class: "flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" },
        props.content
      ),
      props.footer
    )
  );
}

// src/components/dropdown.ts
import van19 from "vanjs-core";
var { div: div4, button: button3, span: span4, input: input2, ul, li, hr } = van19.tags;
function SelectDropdown(props) {
  const getOptions = () => {
    return Array.isArray(props.options) ? props.options : props.options.val;
  };
  const initialVal = (props.value && typeof props.value === "object" && "val" in props.value ? props.value.val : props.value) ?? props.defaultValue ?? (getOptions().length > 0 ? getOptions()[0].value : void 0);
  const selectedValue = props.value && typeof props.value === "object" && "val" in props.value ? props.value : van19.state(initialVal);
  const isOpen = van19.state(false);
  const searchQuery = van19.state("");
  const focusedIndex = van19.state(-1);
  const containerId = props.id ?? `vui-select-${Math.random().toString(36).slice(2, 8)}`;
  const listboxId = `${containerId}-listbox`;
  const closeMenu = () => {
    isOpen.val = false;
    searchQuery.val = "";
    focusedIndex.val = -1;
  };
  const toggleMenu = () => {
    const isDisabled = props.disabled && typeof props.disabled === "object" && "val" in props.disabled ? props.disabled.val : Boolean(props.disabled);
    if (isDisabled) return;
    isOpen.val = !isOpen.val;
    if (isOpen.val) {
      const opts = getOptions();
      const currentIdx = opts.findIndex((o) => o.value === selectedValue.val);
      focusedIndex.val = currentIdx >= 0 ? currentIdx : 0;
    } else {
      searchQuery.val = "";
      focusedIndex.val = -1;
    }
  };
  const selectOption = (opt) => {
    if (opt.disabled) return;
    selectedValue.val = opt.value;
    props.onChange?.(opt.value, opt);
    closeMenu();
    const triggerBtn = document.getElementById(`${containerId}-btn`);
    triggerBtn?.focus();
  };
  if (typeof window !== "undefined") {
    const handleDocumentClick = (e) => {
      const el = document.getElementById(containerId);
      if (el && !el.contains(e.target) && isOpen.val) {
        closeMenu();
      }
    };
    document.addEventListener("click", handleDocumentClick);
  }
  const handleKeyDown = (e, filteredOpts) => {
    if (!isOpen.val) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        isOpen.val = true;
        const currentIdx = filteredOpts.findIndex((o) => o.value === selectedValue.val);
        focusedIndex.val = currentIdx >= 0 ? currentIdx : 0;
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      const triggerBtn = document.getElementById(`${containerId}-btn`);
      triggerBtn?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusedIndex.val = (focusedIndex.val + 1) % filteredOpts.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusedIndex.val = (focusedIndex.val - 1 + filteredOpts.length) % filteredOpts.length;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focusedIndex.val >= 0 && focusedIndex.val < filteredOpts.length) {
        selectOption(filteredOpts[focusedIndex.val]);
      }
    } else if (e.key === "Tab") {
      closeMenu();
    }
  };
  const isDisabledGetter = () => props.disabled && typeof props.disabled === "object" && "val" in props.disabled ? props.disabled.val : Boolean(props.disabled);
  return div4(
    {
      id: containerId,
      class: `relative inline-block w-full text-left ${props.class ?? ""}`,
      onkeydown: (e) => {
        const opts = getOptions().filter(
          (opt) => props.searchable && searchQuery.val ? String(typeof opt.label === "object" && "val" in opt.label ? opt.label.val : opt.label).toLowerCase().includes(searchQuery.val.toLowerCase()) : true
        );
        handleKeyDown(e, opts);
      }
    },
    // Botón / Trigger
    button3(
      {
        id: `${containerId}-btn`,
        type: "button",
        role: "combobox",
        "aria-haspopup": "listbox",
        "aria-expanded": () => isOpen.val ? "true" : "false",
        "aria-controls": listboxId,
        disabled: isDisabledGetter,
        class: () => `w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium transition-all shadow-sm outline-none ${isDisabledGetter() ? "opacity-50 cursor-not-allowed" : "hover:border-focus focus:ring-2 focus:ring-focus cursor-pointer"}`,
        onclick: toggleMenu
      },
      () => {
        const allOpts = getOptions();
        const currentOpt = allOpts.find((o) => o.value === selectedValue.val);
        return div4(
          { class: "flex items-center gap-2 truncate" },
          currentOpt?.icon ?? null,
          span4(
            { class: currentOpt ? "text-foreground" : "text-muted" },
            currentOpt ? currentOpt.label : props.placeholder ?? "Seleccionar opci\xF3n..."
          )
        );
      },
      () => span4(
        {
          class: `text-xs text-muted transition-transform duration-200 ${isOpen.val ? "rotate-180" : ""}`
        },
        "\u25BC"
      )
    ),
    // Menú desplegable
    () => {
      if (!isOpen.val) return span4({ class: "hidden" });
      const allOpts = getOptions();
      const filtered = allOpts.filter((opt) => {
        if (!props.searchable || !searchQuery.val) return true;
        const text = String(
          typeof opt.label === "object" && "val" in opt.label ? opt.label.val : opt.label
        ).toLowerCase();
        return text.includes(searchQuery.val.toLowerCase());
      });
      return div4(
        {
          class: "absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-background shadow-xl overflow-hidden"
        },
        props.searchable ? div4(
          { class: "p-2 border-b border-border bg-secondary/10" },
          input2({
            type: "text",
            placeholder: props.searchPlaceholder ?? t("dropdown.searchPlaceholder", "Buscar..."),
            value: searchQuery.val,
            class: "w-full px-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-focus",
            oninput: (e) => searchQuery.val = e.target.value,
            onkeydown: (e) => e.stopPropagation()
          })
        ) : null,
        ul(
          {
            id: listboxId,
            role: "listbox",
            class: "max-h-60 overflow-y-auto py-1 list-none m-0 p-0"
          },
          filtered.length === 0 ? li(
            { class: "px-3 py-4 text-xs text-center text-muted italic" },
            t("dropdown.empty", "No se encontraron resultados")
          ) : filtered.map((opt, idx) => {
            const isSelected = selectedValue.val === opt.value;
            const isFocused = focusedIndex.val === idx;
            return li(
              {
                role: "option",
                "aria-selected": isSelected ? "true" : "false",
                ...opt.disabled ? { "aria-disabled": "true" } : {},
                class: `flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${opt.disabled ? "opacity-40 cursor-not-allowed" : isSelected ? "bg-primary/10 text-primary font-semibold" : isFocused ? "bg-secondary/20 text-foreground" : "text-foreground hover:bg-secondary/15"}`,
                onclick: (e) => {
                  e.stopPropagation();
                  selectOption(opt);
                }
              },
              div4(
                { class: "flex items-center gap-2 truncate" },
                opt.icon ?? null,
                div4(
                  { class: "flex flex-col truncate" },
                  span4({ class: "truncate" }, opt.label),
                  opt.description ? span4(
                    { class: "text-xs text-muted font-normal truncate" },
                    opt.description
                  ) : null
                )
              ),
              isSelected ? Icon({ name: "check", class: "size-3.5 text-primary" }) : null
            );
          })
        )
      );
    }
  );
}
function DropdownMenu(props) {
  const isOpen = van19.state(false);
  const containerId = props.id ?? `vui-dropdown-${Math.random().toString(36).slice(2, 8)}`;
  const align = props.align ?? "left";
  const close = () => isOpen.val = false;
  const toggle = () => isOpen.val = !isOpen.val;
  if (typeof window !== "undefined") {
    const handleDocumentClick = (e) => {
      const el = document.getElementById(containerId);
      if (el && !el.contains(e.target) && isOpen.val) {
        close();
      }
    };
    document.addEventListener("click", handleDocumentClick);
  }
  return div4(
    {
      id: containerId,
      class: `relative inline-block text-left ${props.class ?? ""}`,
      onkeydown: (e) => {
        if (e.key === "Escape" && isOpen.val) {
          e.preventDefault();
          close();
        }
      }
    },
    div4(
      {
        class: "cursor-pointer inline-flex",
        onclick: (e) => {
          e.stopPropagation();
          toggle();
        }
      },
      props.trigger(isOpen)
    ),
    () => {
      if (!isOpen.val) return span4({ class: "hidden" });
      return div4(
        {
          class: `absolute top-full mt-1 z-50 min-w-[12rem] rounded-xl border border-border bg-background shadow-xl py-1 ${align === "right" ? "right-0" : "left-0"}`,
          role: "menu",
          "aria-orientation": "vertical"
        },
        props.items.map((item) => {
          if (item.type === "divider") {
            return hr({ class: "border-border my-1" });
          }
          if (item.type === "header") {
            return div4(
              {
                class: "px-3 py-1.5 text-xs font-bold text-muted uppercase tracking-wider"
              },
              item.label
            );
          }
          return button3(
            {
              type: "button",
              role: "menuitem",
              ...item.disabled ? { disabled: true } : {},
              class: `w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors border-none bg-transparent ${item.disabled ? "opacity-40 cursor-not-allowed" : item.destructive ? "text-destructive hover:bg-destructive/10 cursor-pointer font-medium" : "text-foreground hover:bg-secondary/20 cursor-pointer"}`,
              onclick: (e) => {
                if (item.disabled) return;
                item.onClick?.(e);
                close();
              }
            },
            div4(
              { class: "flex items-center gap-2" },
              item.icon ?? null,
              span4(item.label)
            ),
            item.badge !== void 0 ? span4(
              {
                class: "text-xs px-1.5 py-0.5 rounded bg-secondary/30 text-foreground-soft font-mono"
              },
              item.badge
            ) : null
          );
        })
      );
    }
  );
}

// src/components/confirm-dialog.ts
import van20 from "vanjs-core";
var { div: div5, p, span: span5 } = van20.tags;
function ConfirmDialog(props) {
  const variant = props.variant ?? "primary";
  const confirmBtn = () => {
    const text = props.confirmText ?? t("dialog.confirm", "Confirmar");
    const onclick = () => {
      modal.close();
      props.onConfirm?.();
    };
    if (variant === "danger") return Button({ variant: "destructive", onclick }, text);
    return PrimaryButton({ onclick }, text);
  };
  const variantIcon = variant === "danger" ? "alert-triangle" : variant === "warning" ? "bell" : "question";
  const body = () => div5(
    { class: "flex items-start gap-3.5 py-1" },
    props.icon ?? Icon({ name: variantIcon, class: "size-5 mt-0.5" }),
    div5(
      { class: "flex-1 text-sm text-foreground-soft leading-relaxed" },
      typeof props.message === "function" ? props.message() : typeof props.message === "string" ? p({ class: "m-0" }, props.message) : props.message
    )
  );
  const footer = () => div5(
    { class: "pt-4 flex items-center justify-end gap-2.5" },
    SecondaryButton(
      {
        onclick: () => {
          modal.close();
          props.onCancel?.();
        }
      },
      props.cancelText ?? t("dialog.cancel", "Cancelar")
    ),
    confirmBtn()
  );
  const modal = Modal({
    title: props.title ?? t("dialog.confirmTitle", "Confirmar acci\xF3n"),
    body,
    footer
  });
  return modal;
}
function confirmDialog(options) {
  return new Promise((resolve) => {
    const dialog = ConfirmDialog({
      ...options,
      onConfirm: () => {
        options.onConfirm?.();
        resolve(true);
      },
      onCancel: () => {
        options.onCancel?.();
        resolve(false);
      }
    });
    dialog.mount();
    dialog.open();
  });
}

// src/components/toast.ts
import van21 from "vanjs-core";
var { div: div6, span: span6, button: button4 } = van21.tags;
var ToastManager = class {
  items = van21.state([]);
  containerMounted = false;
  ensureContainer() {
    if (this.containerMounted || typeof document === "undefined") return;
    this.containerMounted = true;
    const containerEl = div6(
      {
        id: "vanuikit-toast-container",
        class: "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      },
      () => div6(
        { class: "flex flex-col gap-2 w-full" },
        this.items.val.map((item) => this.renderToast(item))
      )
    );
    if (document.body) {
      document.body.appendChild(containerEl);
    } else {
      window.addEventListener("DOMContentLoaded", () => {
        document.body.appendChild(containerEl);
      });
    }
  }
  renderToast(item) {
    const bgStyles = {
      info: "bg-blue-900/90 border-blue-600/50 text-blue-100",
      success: "bg-emerald-900/90 border-emerald-600/50 text-emerald-100",
      warning: "bg-amber-900/90 border-amber-600/50 text-amber-100",
      error: "bg-rose-900/90 border-rose-600/50 text-rose-100"
    };
    const iconNames = {
      info: "info",
      success: "check",
      warning: "alert-triangle",
      error: "x"
    };
    return div6(
      {
        id: `toast-${item.id}`,
        class: `pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur shadow-xl transition-all ${bgStyles[item.type]}`
      },
      span6(
        {
          class: "flex items-center justify-center w-6 h-6 rounded-full bg-white/10 shrink-0 mt-0.5"
        },
        Icon({ name: iconNames[item.type], class: "size-3.5" })
      ),
      div6(
        { class: "flex-1 min-w-0" },
        item.title ? div6({ class: "font-semibold text-sm leading-tight text-white mb-0.5" }, item.title) : null,
        div6({ class: "text-xs opacity-90 leading-relaxed break-words" }, item.message)
      ),
      button4(
        {
          type: "button",
          class: "text-white/60 hover:text-white p-1 text-xs rounded transition-colors shrink-0 -mr-1 -mt-1",
          onclick: () => this.remove(item.id)
        },
        Icon({ name: "x", class: "size-3.5" })
      )
    );
  }
  show(type, message, options) {
    this.ensureContainer();
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = options?.durationMs ?? 4e3;
    const newItem = {
      id,
      type,
      message,
      title: options?.title,
      durationMs: duration
    };
    this.items.val = [...this.items.val, newItem];
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    return id;
  }
  info(message, options) {
    return this.show("info", message, options);
  }
  success(message, options) {
    return this.show("success", message, options);
  }
  warning(message, options) {
    return this.show("warning", message, options);
  }
  error(message, options) {
    return this.show("error", message, options);
  }
  remove(id) {
    this.items.val = this.items.val.filter((item) => item.id !== id);
  }
  clear() {
    this.items.val = [];
  }
};
var toast = new ToastManager();

// src/components/alert.ts
import van22 from "vanjs-core";
var VARIANT_STYLES = {
  info: { box: "bg-blue-500/10 border-blue-500/20", icon: "info" },
  success: { box: "bg-emerald-500/10 border-emerald-500/20", icon: "check-circle" },
  warning: { box: "bg-amber-500/10 border-amber-500/20", icon: "alert-triangle" },
  error: { box: "bg-rose-500/10 border-rose-500/20", icon: "x-circle" }
};
var Alert = (props = {}, ...children) => {
  const { div: div7, p: p2, span: span7, button: button5 } = van22.tags;
  const styles = VARIANT_STYLES[props.variant ?? "info"];
  const visible = van22.state(true);
  const dismissLabel = t("alert.dismiss", "Cerrar aviso");
  return div7(
    {
      role: "alert",
      class: () => cx(
        "alert flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        styles.box,
        visible.val ? "" : "hidden",
        props.class
      )
    },
    props.showIcon !== false ? props.icon ?? Icon({ name: styles.icon, class: "size-4 mt-0.5" }) : null,
    div7(
      { class: "flex-1 space-y-0.5" },
      props.title !== void 0 ? p2({ class: "font-semibold text-foreground" }, props.title) : null,
      children.length ? div7({ class: "text-foreground-soft" }, ...children) : null
    ),
    props.dismissible ? button5(
      {
        class: "shrink-0 cursor-pointer rounded p-1 leading-none text-foreground-soft transition-colors hover:text-foreground",
        "aria-label": dismissLabel,
        onclick: () => {
          visible.val = false;
          props.onDismiss?.();
        }
      },
      Icon({ name: "x", class: "size-3.5" })
    ) : null
  );
};

// src/components/progress.ts
import van23 from "vanjs-core";
var TRACK_SIZES2 = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
var Progress = (props = {}) => {
  const { div: div7, span: span7 } = van23.tags;
  const value = asState(props.value, 0);
  const indeterminate = asState(props.indeterminate, false);
  const size = TRACK_SIZES2[props.size ?? "md"];
  const pct = van23.derive(() => Math.min(100, Math.max(0, Math.round(value.val))));
  const trackAttrs = {
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "aria-valuenow": () => String(pct.val),
    class: () => cx("w-full overflow-hidden rounded-full bg-border", size)
  };
  if (props.label !== void 0) trackAttrs["aria-label"] = props.label;
  return div7(
    { class: () => cx("progress flex flex-col gap-1", props.class) },
    props.label !== void 0 || props.showValue !== false ? div7(
      { class: "flex items-center justify-between text-xs text-foreground-soft" },
      props.label !== void 0 ? span7(props.label) : span7(),
      props.showValue === false ? null : span7(
        { class: () => cx("progress-value", indeterminate.val ? "hidden" : "") },
        () => `${pct.val}%`
      )
    ) : null,
    div7(
      trackAttrs,
      span7({
        class: () => cx(
          "block h-full rounded-full transition-all duration-300",
          props.fillClass ?? "bg-accent",
          indeterminate.val ? "w-1/3 animate-pulse" : ""
        ),
        style: () => indeterminate.val ? "" : `width: ${pct.val}%`
      })
    )
  );
};

// src/components/skeleton.ts
import van24 from "vanjs-core";
var Skeleton = (props = {}) => {
  const { div: div7 } = van24.tags;
  const base = "animate-pulse bg-border";
  if (props.variant === "circle") {
    return div7({ class: cx(base, "size-10 rounded-full", props.class), "aria-hidden": "true" });
  }
  if (props.variant === "block") {
    return div7({ class: cx(base, "h-24 w-full rounded-xl", props.class), "aria-hidden": "true" });
  }
  const lines = Math.max(1, props.lines ?? 3);
  return div7(
    { class: cx("space-y-2", props.class), "aria-hidden": "true" },
    ...Array.from(
      { length: lines },
      (_, i) => div7({
        class: cx(base, "h-3 rounded", i === lines - 1 && lines > 1 ? "w-2/3" : "w-full")
      })
    )
  );
};

// src/components/empty-state.ts
import van25 from "vanjs-core";
var EmptyState = (props) => {
  const { div: div7, p: p2 } = van25.tags;
  return div7(
    {
      class: cx(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center",
        props.class
      )
    },
    div7(
      { class: "text-3xl text-muted-foreground/60", "aria-hidden": "true" },
      props.icon ?? Icon({ name: "inbox", class: "size-9" })
    ),
    p2({ class: "text-sm font-semibold text-foreground" }, props.title),
    props.description ? p2({ class: "max-w-sm text-xs text-foreground-soft" }, props.description) : null,
    props.action ? div7({ class: "pt-2" }, props.action) : null
  );
};

// src/components/tooltip.ts
import van27 from "vanjs-core";

// src/components/overlay.ts
import van26 from "vanjs-core";
var lockCount = 0;
var useScrollLock = (open) => {
  van26.derive(() => {
    if (typeof document === "undefined") return;
    if (open.val) {
      lockCount++;
      if (lockCount === 1) document.body.style.overflow = "hidden";
    } else {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) document.body.style.overflow = "";
    }
  });
};
var isCoarsePointer = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(hover: none)").matches;
};

// src/components/tooltip.ts
var POSITION_CLASSES = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2"
};
var nextId = 0;
var Tooltip = (props, trigger) => {
  const { span: span7 } = van27.tags;
  const position = POSITION_CLASSES[props.position ?? "top"];
  const disabled = props.disabled;
  const visible = van27.state(false);
  let timer;
  const id = `vanuikit-tooltip-${nextId++}`;
  const coarse = isCoarsePointer();
  const show = () => {
    if (readState(disabled, false)) return;
    visible.val = true;
  };
  const scheduleShow = () => {
    if (coarse || readState(disabled, false)) return;
    clearTimeout(timer);
    timer = setTimeout(show, props.delay ?? 300);
  };
  const hide = () => {
    clearTimeout(timer);
    visible.val = false;
  };
  return span7(
    {
      class: "relative inline-flex",
      "aria-describedby": id,
      onmouseenter: scheduleShow,
      onmouseleave: hide,
      onfocusin: () => {
        if (!coarse) show();
      },
      onfocusout: hide
    },
    trigger,
    // La burbuja siempre montada (ancla real): un hijo-función que devuelve
    // null moriría en el primer cambio (keepConnected descarta _dom null).
    span7(
      {
        id,
        role: "tooltip",
        class: () => cx(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg",
          position,
          visible.val ? "" : "hidden",
          props.class
        )
      },
      props.content
    )
  );
};

// src/components/popover.ts
import van28 from "vanjs-core";
var PANEL_POSITIONS = {
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2"
};
var nextId2 = 0;
var Popover = (props) => {
  const { div: div7, span: span7 } = van28.tags;
  const open = van28.state(false);
  const id = `vanuikit-popover-${nextId2++}`;
  const focusTrigger = () => {
    const focusable = containerEl?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  };
  const onDocClick = (e) => {
    if (containerEl && !containerEl.contains(e.target)) setOpen(false);
  };
  const onDocKeydown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      focusTrigger();
    }
  };
  const setOpen = (v) => {
    if (open.val === v) return;
    open.val = v;
    if (typeof document === "undefined") return;
    if (v) {
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onDocKeydown);
    } else {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onDocKeydown);
    }
  };
  const containerEl = div7(
    {
      id,
      class: () => cx("relative inline-block", props.class)
    },
    span7(
      {
        "aria-haspopup": "dialog",
        "aria-expanded": () => open.val ? "true" : "false",
        onclick: () => setOpen(!open.val)
      },
      props.trigger
    ),
    // Panel siempre montado (ancla real): un hijo-función que devuelve null
    // moriría en el primer cambio (keepConnected descarta _dom null). El
    // contenido sí se reconstruye en cada apertura vía la fábrica.
    div7(
      // aria-label solo si fue provisto: undefined escribiría el atributo
      // literal "undefined" (props de van no aceptan undefined).
      {
        role: "dialog",
        "aria-modal": "false",
        ...props.ariaLabel !== void 0 ? { "aria-label": props.ariaLabel } : {},
        class: () => cx(
          "absolute z-50 min-w-[12rem] rounded-xl border border-border bg-background p-4 shadow-xl",
          PANEL_POSITIONS[props.position ?? "bottom"],
          open.val ? "" : "hidden",
          props.panelClass
        )
      },
      () => open.val ? props.content(() => setOpen(false)) : div7()
    )
  );
  return containerEl;
};

// src/components/drawer.ts
import van29 from "vanjs-core";
var SIDE_PANEL = {
  left: { base: "inset-y-0 left-0 w-80 max-w-[85vw]", open: "translate-x-0", closed: "-translate-x-full" },
  right: { base: "inset-y-0 right-0 w-80 max-w-[85vw]", open: "translate-x-0", closed: "translate-x-full" },
  top: { base: "inset-x-0 top-0 h-80 max-h-[85vh]", open: "translate-y-0", closed: "-translate-y-full" },
  bottom: { base: "inset-x-0 bottom-0 h-80 max-h-[85vh]", open: "translate-y-0", closed: "translate-y-full" }
};
var FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
var Drawer = (props, ...content) => {
  const { div: div7, button: button5 } = van29.tags;
  const side = SIDE_PANEL[props.side ?? "right"];
  const dismissible = props.dismissible !== false;
  const showClose = props.showClose !== false;
  let panelEl = null;
  let lastFocused = null;
  const close = () => {
    props.open.val = false;
    props.onClose?.();
  };
  const onKeydown = (e) => {
    if (!props.open.val) return;
    if (e.key === "Escape") {
      if (dismissible) {
        e.preventDefault();
        close();
      }
    } else if (e.key === "Tab" && panelEl) {
      const focusables = panelEl.querySelectorAll(FOCUSABLE);
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!panelEl.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  van29.derive(() => {
    if (typeof document === "undefined") return;
    if (props.open.val) {
      lastFocused = document.activeElement;
      document.addEventListener("keydown", onKeydown);
      panelEl ? panelEl.focus() : setTimeout(() => panelEl?.focus(), 0);
    } else {
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused) {
        lastFocused.focus?.();
        lastFocused = null;
      }
    }
  });
  useScrollLock(props.open);
  const backdrop = div7({
    class: () => cx(
      "absolute inset-0 bg-overlay transition-opacity duration-300",
      props.open.val ? "opacity-100" : "opacity-0"
    ),
    onclick: () => dismissible && close()
  });
  const panel = div7(
    {
      tabindex: "-1",
      role: "dialog",
      "aria-modal": "true",
      class: () => cx(
        "absolute flex flex-col overflow-y-auto bg-background shadow-2xl outline-none transition-transform duration-300",
        side.base,
        props.open.val ? side.open : side.closed,
        props.class
      )
    },
    showClose ? button5(
      {
        type: "button",
        class: "absolute top-3 right-3 z-10 cursor-pointer rounded p-1 text-xl leading-none text-muted transition-colors hover:text-foreground-soft",
        "aria-label": t("modal.close", "Cerrar"),
        onclick: close
      },
      "\xD7"
    ) : null,
    ...content
  );
  const overlay = div7(
    {
      class: () => cx("fixed inset-0 z-50", props.open.val ? "" : "pointer-events-none"),
      "aria-hidden": () => props.open.val ? "false" : "true"
    },
    backdrop,
    panel
  );
  panelEl = panel;
  return overlay;
};

// src/components/avatar.ts
import van30 from "vanjs-core";
var SIZE_CLASSES2 = {
  xs: "w-8 h-8 text-xs",
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-14 h-14 text-base"
};
var getInitials = (name, fallback = "?") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback.slice(0, 2).toUpperCase() || "?";
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};
var Avatar = (props = {}) => {
  const { div: div7, img, span: span7 } = van30.tags;
  const size = SIZE_CLASSES2[props.size ?? "md"];
  const imgFailed = van30.state(false);
  const readName = () => typeof props.name === "object" ? props.name.val ?? "" : props.name ?? "";
  const displayName = van30.derive(readName);
  const initials = van30.derive(() => getInitials(readName()));
  return div7(
    {
      class: () => cx(
        "rounded-full bg-primary text-primary-fg font-bold flex items-center justify-center shrink-0 shadow-2xs select-none overflow-hidden",
        size,
        props.class
      ),
      title: () => displayName.val,
      "aria-label": () => displayName.val,
      ...props.onclick ? { onclick: props.onclick } : {}
    },
    // Anclas siempre montadas: el padre alterna entre imagen e iniciales
    // sin que ningún hijo-función devuelva null.
    () => props.src && !imgFailed.val ? img({
      src: props.src,
      alt: () => displayName.val,
      class: "w-full h-full object-cover",
      onerror: () => imgFailed.val = true
    }) : div7(),
    span7({ class: () => props.src && !imgFailed.val ? "hidden" : "" }, initials)
  );
};

// src/components/breadcrumbs.ts
import van31 from "vanjs-core";
var Breadcrumbs = (props) => {
  const { nav: nav2, ol, li: li2, span: span7 } = van31.tags;
  const ariaLabel = props.ariaLabel ?? t("breadcrumbs.ariaLabel", "Ruta de navegaci\xF3n");
  return nav2(
    { "aria-label": ariaLabel, class: () => cx("breadcrumbs", props.class) },
    ol(
      { class: "flex flex-wrap items-center gap-1.5 list-none m-0 p-0 text-sm" },
      ...props.items.map((item, i) => {
        const isLast = i === props.items.length - 1;
        return [
          i > 0 ? li2({ class: "text-muted-foreground select-none", "aria-hidden": "true" }, props.separator ?? "/") : null,
          li2(
            {
              class: () => cx(
                "flex items-center gap-1.5",
                isLast ? "font-semibold text-foreground" : "text-foreground-soft"
              )
            },
            item.icon,
            item.href && !isLast ? Link({ href: item.href, variant: "muted", class: "transition-colors" }, item.label) : isLast ? span7({ "aria-current": "page" }, item.label) : span7(item.label)
          )
        ];
      })
    )
  );
};

// src/components/card.ts
import van32 from "vanjs-core";
var Card = (props = {}, ...children) => van32.tags.div(
  {
    class: () => cx(
      "rounded-xl border border-border bg-card shadow-sm",
      props.hoverable ? "transition-shadow hover:shadow-md" : "",
      props.class
    )
  },
  ...children
);
var CardTitle = (props = {}, ...children) => van32.tags.h3({ class: cx("text-base font-semibold text-foreground", props.class) }, ...children);

// src/components/accordion.ts
import van33 from "vanjs-core";
var nextId3 = 0;
var Accordion = (props) => {
  const { div: div7, button: button5, span: span7 } = van33.tags;
  const uid = `vanuikit-accordion-${nextId3++}`;
  const openIds = van33.state([...props.defaultOpen ?? []]);
  const toggle = (item) => {
    if (readState(item.disabled, false)) return;
    const isOpen = openIds.val.includes(item.id);
    if (isOpen) {
      openIds.val = openIds.val.filter((id) => id !== item.id);
    } else if (props.multiple) {
      openIds.val = [...openIds.val, item.id];
    } else {
      openIds.val = [item.id];
    }
  };
  return div7(
    { class: () => cx("accordion divide-y divide-border rounded-xl border border-border bg-card", props.class) },
    ...props.items.map((item) => {
      const regionId = `${uid}-${item.id}-region`;
      const btnId = `${uid}-${item.id}-button`;
      return div7(
        {},
        button5(
          {
            id: btnId,
            type: "button",
            "aria-expanded": () => openIds.val.includes(item.id) ? "true" : "false",
            "aria-controls": regionId,
            disabled: () => readState(item.disabled, false),
            class: () => cx(
              "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/20",
              readState(item.disabled, false) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            ),
            onclick: () => toggle(item)
          },
          span7(item.title),
          span7(
            {
              class: () => cx(
                "text-muted-foreground transition-transform duration-200",
                openIds.val.includes(item.id) ? "rotate-90" : ""
              ),
              "aria-hidden": "true"
            },
            "\u25B8"
          )
        ),
        // Región siempre montada (ancla real); el contenido se fabrica al abrir.
        div7(
          {
            id: regionId,
            role: "region",
            "aria-labelledby": btnId,
            class: () => openIds.val.includes(item.id) ? "" : "hidden"
          },
          () => openIds.val.includes(item.id) ? div7({ class: "px-4 pb-4 text-sm text-foreground-soft" }, item.content()) : div7()
        )
      );
    })
  );
};

// src/components/combobox.ts
import van34 from "vanjs-core";
var nextId4 = 0;
var labelOf = (opt) => typeof opt.label === "object" ? opt.label.val ?? "" : opt.label;
var Combobox = (props) => {
  const { div: div7, input: input3, ul: ul2, li: li2, p: p2, span: span7, button: button5 } = van34.tags;
  const name = props.name ?? "combobox";
  const uid = `vanuikit-combobox-${nextId4++}`;
  const listboxId = `${uid}-listbox`;
  const multi = props.multiple === true;
  const selected = asState(props.value, "");
  const selectedMulti = asState(props.value, []);
  const query = van34.state("");
  const open = van34.state(false);
  const focusedIdx = van34.state(-1);
  const disabled = asState(props.disabled, false);
  let containerEl = null;
  let textInputEl = null;
  const requiredMsg = props.requiredMsg ?? t("radio.required", "Selecciona una opci\xF3n");
  const validators = props.required ? [Required(requiredMsg)] : [];
  const selectedLabel = van34.derive(() => {
    const opt = props.options.find((o) => o.value === selected.val);
    return opt ? labelOf(opt) : "";
  });
  const display = van34.derive(
    () => multi ? query.val : open.val ? query.val : selectedLabel.val
  );
  const filtered = van34.derive(() => {
    const q = query.val.trim().toLowerCase();
    return q ? props.options.filter((o) => labelOf(o).toLowerCase().includes(q)) : props.options;
  });
  const enabledIdxs = van34.derive(() => {
    const fs = filtered.val;
    const idxs = [];
    fs.forEach((o, i) => !readState(o.disabled, false) && idxs.push(i));
    return idxs;
  });
  const clampFocus = () => {
    const max = enabledIdxs.val.length - 1;
    if (focusedIdx.val > max) focusedIdx.val = max;
  };
  const setOpen = (v) => {
    if (open.val === v) return;
    open.val = v;
    if (typeof document === "undefined") return;
    if (v) {
      document.addEventListener("click", onDocClick);
    } else {
      document.removeEventListener("click", onDocClick);
      query.val = "";
      focusedIdx.val = -1;
    }
  };
  const onDocClick = (e) => {
    if (containerEl && !containerEl.contains(e.target)) setOpen(false);
  };
  const moveFocus = (dir) => {
    const enabled = enabledIdxs.val;
    if (!enabled.length) return;
    if (dir === "first") {
      focusedIdx.val = enabled[0];
    } else if (dir === "last") {
      focusedIdx.val = enabled[enabled.length - 1];
    } else {
      const cur = enabled.indexOf(focusedIdx.val);
      const next = cur === -1 ? dir === 1 ? enabled[0] : enabled[enabled.length - 1] : enabled[(cur + dir + enabled.length) % enabled.length];
      focusedIdx.val = next;
    }
  };
  const removeMulti = (value) => {
    selectedMulti.val = selectedMulti.val.filter((v) => v !== value);
    if (field.isTouched.val) field.validate();
  };
  const select = (opt) => {
    if (readState(opt.disabled, false)) return;
    field.isTouched.val = true;
    if (multi) {
      if (selectedMulti.val.includes(opt.value)) {
        removeMulti(opt.value);
      } else {
        selectedMulti.val = [...selectedMulti.val, opt.value];
      }
      query.val = "";
    } else {
      selected.val = opt.value;
      setOpen(false);
    }
    field.validate();
  };
  const handleKeydown = (e) => {
    if (readState(disabled, false)) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open.val) {
          setOpen(true);
          focusedIdx.val = enabledIdxs.val[0] ?? -1;
        } else {
          moveFocus(1);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open.val) {
          setOpen(true);
          focusedIdx.val = enabledIdxs.val[enabledIdxs.val.length - 1] ?? -1;
        } else {
          moveFocus(-1);
        }
        break;
      case "Home":
        if (open.val) {
          e.preventDefault();
          moveFocus("first");
        }
        break;
      case "End":
        if (open.val) {
          e.preventDefault();
          moveFocus("last");
        }
        break;
      case "Enter":
        if (open.val && focusedIdx.val >= 0) {
          e.preventDefault();
          const opt = filtered.val[focusedIdx.val];
          if (opt) select(opt);
        }
        break;
      case "Backspace":
        if (multi && query.val === "" && selectedMulti.val.length) {
          e.preventDefault();
          removeMulti(selectedMulti.val[selectedMulti.val.length - 1]);
        }
        break;
      case "Escape":
        if (open.val) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };
  const optId = (i) => `${listboxId}-opt-${i}`;
  const dom = () => {
    const errorText = van34.derive(
      () => field.isInvalid.val || field.isTouched.val && !!field.error.val ? field.error.val : ""
    );
    const sharedInputAttrs = {
      type: "text",
      id: name,
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": () => open.val ? "true" : "false",
      "aria-controls": listboxId,
      "aria-activedescendant": () => open.val && focusedIdx.val >= 0 ? optId(focusedIdx.val) : "",
      "aria-invalid": () => field.isInvalid.val ? "true" : "false",
      autocomplete: "off",
      value: () => display.val,
      placeholder: props.placeholder ?? t("dropdown.searchPlaceholder", "Buscar..."),
      disabled: () => disabled.val,
      oninput: (e) => {
        query.val = e.target.value;
        if (!open.val) setOpen(true);
        focusedIdx.val = enabledIdxs.val[0] ?? -1;
      },
      onfocus: () => {
        setOpen(true);
        if (focusedIdx.val < 0) focusedIdx.val = enabledIdxs.val[0] ?? -1;
      },
      onkeydown: handleKeydown
    };
    const triggerArea = multi ? div7(
      {
        class: () => cx(
          "flex w-full flex-wrap items-center gap-1.5 min-h-[2.625rem] px-2 py-1.5 border rounded-md text-sm transition-colors cursor-text",
          field.isInvalid.val ? "border-destructive" : "border-border focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent",
          disabled.val ? "opacity-50 cursor-not-allowed" : ""
        ),
        onclick: () => textInputEl?.focus()
      },
      // Ancla única para los chips (los hijos internos se regeneran).
      () => div7(
        { class: "contents" },
        ...selectedMulti.val.map((v) => {
          const opt = props.options.find((o) => o.value === v);
          const label = opt ? labelOf(opt) : v;
          return span7(
            {
              class: "flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            },
            label,
            button5(
              {
                type: "button",
                class: "cursor-pointer rounded-full hover:bg-primary/20 leading-none px-0.5",
                "aria-label": raw("combobox.remove", "Quitar {name}", { name: label }),
                onclick: (e) => {
                  e.stopPropagation();
                  removeMulti(v);
                }
              },
              "\xD7"
            )
          );
        })
      ),
      input3({
        ...sharedInputAttrs,
        class: "min-w-[6rem] flex-1 border-none bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-0"
      })
    ) : input3({
      ...sharedInputAttrs,
      class: () => cx(
        "w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2",
        field.isInvalid.val ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-accent/30 focus:border-accent",
        disabled.val ? "opacity-50 cursor-not-allowed" : ""
      )
    });
    containerEl = div7(
      { class: () => cx("field combobox relative flex flex-col gap-1", field.stateClass.val, props.class) },
      multi ? input3({
        type: "hidden",
        name,
        value: () => selectedMulti.val.join(",")
      }) : input3({ type: "hidden", name, value: () => selected.val }),
      triggerArea,
      // Panel siempre montado (ancla real); el ul completo se regenera con
      // cada filtrado (un único nodo por render: sin hijos-función null).
      div7(
        {
          class: () => cx(
            "absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-background shadow-xl overflow-hidden",
            open.val ? "" : "hidden"
          )
        },
        () => {
          clampFocus();
          const fs = filtered.val;
          return ul2(
            {
              id: listboxId,
              role: "listbox",
              ...multi ? { "aria-multiselectable": "true" } : {},
              class: "max-h-60 overflow-y-auto py-1 list-none m-0"
            },
            fs.length === 0 ? li2(
              { class: "px-3 py-4 text-xs text-center text-muted italic" },
              t("dropdown.empty", "No se encontraron resultados")
            ) : fs.map((opt, i) => {
              const isSelected = multi ? selectedMulti.val.includes(opt.value) : selected.val === opt.value;
              const isFocused = focusedIdx.val === i;
              const enabled = !readState(opt.disabled, false);
              return li2({
                id: optId(i),
                role: "option",
                "aria-selected": isSelected ? "true" : "false",
                ...enabled ? {} : { "aria-disabled": "true" },
                class: cx(
                  "flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors",
                  !enabled ? "opacity-40 cursor-not-allowed" : isSelected ? "bg-primary/10 text-primary font-semibold" : isFocused ? "bg-secondary/20 text-foreground" : "text-foreground hover:bg-secondary/15"
                ),
                onmousedown: (e) => e.preventDefault(),
                onclick: () => select(opt),
                onmousemove: () => {
                  if (enabled && focusedIdx.val !== i) focusedIdx.val = i;
                }
              }, labelOf(opt));
            })
          );
        }
      ),
      p2(
        { class: () => errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden" },
        () => errorText.val
      )
    );
    textInputEl = containerEl.querySelector('input[type="text"]');
    return containerEl;
  };
  const field = createControlField(
    {
      name,
      value: multi ? van34.derive(() => selectedMulti.val.join(",")) : selected,
      currentValue: () => multi ? selectedMulti.val.join(",") : selected.val,
      applyValue: (rawStr) => {
        if (multi) {
          selectedMulti.val = rawStr ? rawStr.split(",") : [];
        } else {
          selected.val = rawStr;
        }
      }
    },
    { dom },
    validators
  );
  return field;
};

// src/components/pagination.ts
import van35 from "vanjs-core";
var pageSlots = (page, totalPages, siblingCount) => {
  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), total);
  if (total <= siblingCount * 2 + 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const midStart = Math.max(2, current - siblingCount);
  const midEnd = Math.min(total - 1, current + siblingCount);
  const slots = [1];
  if (midStart > 2) slots.push("ellipsis-l");
  for (let i = midStart; i <= midEnd; i++) slots.push(i);
  if (midEnd < total - 1) slots.push("ellipsis-r");
  slots.push(total);
  return slots;
};
var Pagination = (props) => {
  const { nav: nav2, button: button5, span: span7 } = van35.tags;
  const page = asState(props.page, 1);
  const totalPages = asState(props.totalPages, 1);
  const siblingCount = props.siblingCount ?? 1;
  const ariaLabel = props.ariaLabel ?? t("pagination.ariaLabel", "Paginaci\xF3n");
  const go = (p2) => {
    page.val = Math.min(Math.max(1, p2), totalPages.val);
  };
  const baseBtn = "flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 text-sm text-foreground transition-colors cursor-pointer hover:bg-secondary/20 disabled:opacity-40 disabled:pointer-events-none select-none";
  return nav2(
    { "aria-label": ariaLabel, class: () => cx("pagination flex items-center gap-1.5", props.class) },
    button5(
      {
        type: "button",
        "aria-label": t("pagination.previous", "Anterior"),
        disabled: () => page.val <= 1,
        class: baseBtn,
        onclick: () => go(page.val - 1)
      },
      "\u2039"
    ),
    () => {
      const slots = pageSlots(page.val, totalPages.val, siblingCount);
      return span7(
        { class: "flex items-center gap-1.5" },
        ...slots.map((slot) => {
          if (typeof slot !== "number") {
            return span7(
              { class: "flex h-8 min-w-6 items-center justify-center text-muted-foreground", "aria-hidden": "true" },
              "\u2026"
            );
          }
          const isCurrent = slot === page.val;
          return button5(
            {
              type: "button",
              ...isCurrent ? { "aria-current": "page" } : { "aria-label": String(slot) },
              class: () => cx(
                baseBtn,
                isCurrent ? "bg-primary text-primary-fg border-primary hover:bg-primary pointer-events-none" : ""
              ),
              onclick: () => go(slot)
            },
            String(slot)
          );
        })
      );
    },
    button5(
      {
        type: "button",
        "aria-label": t("pagination.next", "Siguiente"),
        disabled: () => page.val >= totalPages.val,
        class: baseBtn,
        onclick: () => go(page.val + 1)
      },
      "\u203A"
    )
  );
};

// src/components/datepicker.ts
import van36 from "vanjs-core";
var toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
var iso = (d) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
  d.getDate()
).padStart(2, "0")}` : "";
var parseIso = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
};
var daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
var sameDay = (a, b) => !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
var chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};
var DatePicker = (props) => {
  const { div: div7, label, input: input3, table: table2, thead: thead2, tbody: tbody2, tr: tr2, th: th2, td: td2, button: button5, p: p2 } = van36.tags;
  const name = props.name ?? "date";
  const firstDow = ((props.firstDayOfWeek ?? 1) % 7 + 7) % 7;
  const inline = props.inline === true;
  const disabled = asState(props.disabled, false);
  const selected = typeof props.value === "object" && props.value !== null && "val" in props.value ? props.value : van36.state(props.value ?? null);
  const today = toDateOnly(/* @__PURE__ */ new Date());
  const minState = typeof props.min === "object" && props.min !== null && "val" in props.min ? props.min : van36.state(props.min ?? null);
  const maxState = typeof props.max === "object" && props.max !== null && "val" in props.max ? props.max : van36.state(props.max ?? null);
  const viewYear = van36.state(selected.val ? selected.val.getFullYear() : today.getFullYear());
  const viewMonth = van36.state(selected.val ? selected.val.getMonth() : today.getMonth());
  const open = van36.state(false);
  const focused = van36.state(selected.val ?? today);
  let containerEl = null;
  const requiredMsg = props.requiredMsg ?? t("datepicker.required", "Selecciona una fecha");
  const validators = props.required ? [Required(requiredMsg)] : [];
  const monthTitle = van36.derive(() => {
    const s = new Intl.DateTimeFormat(i18n.currentLocale.val, {
      month: "long",
      year: "numeric"
    }).format(new Date(viewYear.val, viewMonth.val, 1));
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
  const weekdayCols = van36.derive(() => {
    const fmt2 = new Intl.DateTimeFormat(i18n.currentLocale.val, { weekday: "short" });
    const byDow = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2021, 0, 3 + i);
      byDow[d.getDay()] = fmt2.format(d);
    }
    const cols = [];
    for (let c = 0; c < 7; c++) cols.push(byDow[(firstDow + c) % 7]);
    return cols;
  });
  const cells = van36.derive(() => {
    const y = viewYear.val;
    const m = viewMonth.val;
    const first = new Date(y, m, 1);
    const offset = (first.getDay() - firstDow + 7) % 7;
    const start = new Date(y, m, 1 - offset);
    const count = Math.ceil((offset + daysInMonth(y, m)) / 7) * 7;
    const minD = minState.val ? toDateOnly(minState.val) : void 0;
    const maxD = maxState.val ? toDateOnly(maxState.val) : void 0;
    const list = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const within = !(minD && d < minD) && !(maxD && d > maxD);
      list.push({
        date: d,
        inMonth: d.getMonth() === m,
        today: sameDay(today, d),
        selected: sameDay(selected.val, d),
        disabled: !within,
        focused: sameDay(focused.val, d)
      });
    }
    return list;
  });
  const display = van36.derive(() => {
    const s = selected.val;
    if (!s) return "";
    return new Intl.DateTimeFormat(i18n.currentLocale.val, { dateStyle: "medium" }).format(s);
  });
  const prevMonthLabel = van36.derive(() => raw("datepicker.prevMonth", "Mes anterior"));
  const nextMonthLabel = van36.derive(() => raw("datepicker.nextMonth", "Mes siguiente"));
  const todayLabel = van36.derive(() => raw("datepicker.today", "Hoy"));
  const longDateLabel = (d) => new Intl.DateTimeFormat(i18n.currentLocale.val, {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(d);
  const syncViewTo = (d) => {
    viewYear.val = d.getFullYear();
    viewMonth.val = d.getMonth();
  };
  const changeMonth = (delta) => {
    let m = viewMonth.val + delta;
    let y = viewYear.val;
    while (m < 0) {
      m += 12;
      y--;
    }
    while (m > 11) {
      m -= 12;
      y++;
    }
    viewMonth.val = m;
    viewYear.val = y;
  };
  const select = (d) => {
    if (readState(disabled, false)) return;
    const minD = minState.val ? toDateOnly(minState.val) : void 0;
    const maxD = maxState.val ? toDateOnly(maxState.val) : void 0;
    if (minD && d < minD) return;
    if (maxD && d > maxD) return;
    selected.val = toDateOnly(d);
    syncViewTo(selected.val);
    focused.val = selected.val;
    field.isTouched.val = true;
    field.validate();
    if (!inline) setOpen(false);
  };
  const goToToday = () => {
    selected.val = toDateOnly(/* @__PURE__ */ new Date());
    syncViewTo(selected.val);
    focused.val = selected.val;
    field.isTouched.val = true;
    field.validate();
    if (!inline) setOpen(false);
  };
  const setOpen = (v) => {
    if (open.val === v) return;
    open.val = v;
    if (typeof document === "undefined") return;
    if (v) {
      if (selected.val) syncViewTo(selected.val);
      document.addEventListener("click", onDocClick);
    } else {
      document.removeEventListener("click", onDocClick);
    }
  };
  const onDocClick = (e) => {
    if (containerEl && !containerEl.contains(e.target)) setOpen(false);
  };
  const moveFocus = (dy, dx) => {
    const cur = focused.val;
    const next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + dx + dy * 7);
    if (next.getMonth() !== viewMonth.val) syncViewTo(next);
    focused.val = next;
  };
  const addMonthsClamped = (d, delta) => {
    const total = d.getMonth() + delta;
    const y = d.getFullYear() + Math.floor(total / 12);
    const m = (total % 12 + 12) % 12;
    return new Date(y, m, Math.min(d.getDate(), daysInMonth(y, m)));
  };
  const gotoDay = (d) => {
    if (d.getMonth() !== viewMonth.val || d.getFullYear() !== viewYear.val) syncViewTo(d);
    focused.val = d;
  };
  const handleGridKeydown = (e) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(0, -1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveFocus(0, 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocus(1, 0);
        break;
      case "PageUp":
        e.preventDefault();
        gotoDay(addMonthsClamped(focused.val, e.shiftKey ? -12 : -1));
        break;
      case "PageDown":
        e.preventDefault();
        gotoDay(addMonthsClamped(focused.val, e.shiftKey ? 12 : 1));
        break;
      case "Home":
        e.preventDefault();
        gotoDay(e.ctrlKey ? new Date(viewYear.val, 0, 1) : new Date(viewYear.val, viewMonth.val, 1));
        break;
      case "End":
        e.preventDefault();
        gotoDay(
          e.ctrlKey ? new Date(viewYear.val, 11, 31) : new Date(viewYear.val, viewMonth.val, daysInMonth(viewYear.val, viewMonth.val))
        );
        break;
      case "Enter":
        e.preventDefault();
        select(focused.val);
        break;
      case "Escape":
        if (!inline) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        if (!inline) setOpen(false);
        break;
    }
  };
  const handleInputKeydown = (e) => {
    if (readState(disabled, false)) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };
  const cellClass = (cell) => cx(
    "h-9 w-9 rounded-full text-sm transition-colors",
    cell.disabled ? "opacity-30 cursor-not-allowed hover:bg-transparent" : cell.selected ? "bg-primary text-white font-semibold" : cell.today ? "font-semibold border border-accent text-accent hover:bg-secondary" : cell.focused ? "bg-secondary/30 text-foreground" : "text-foreground hover:bg-secondary",
    !cell.inMonth && !cell.selected ? "text-muted/60" : ""
  );
  const grid = van36.derive(
    () => table2(
      { class: "w-full border-collapse text-center" },
      thead2(
        tr2(
          ...weekdayCols.val.map(
            (w) => th2({ class: "text-xs font-medium text-muted py-1 w-9" }, w)
          )
        )
      ),
      tbody2(
        ...chunk(cells.val, 7).map(
          (row) => tr2(
            ...row.map(
              (cell) => td2(
                button5(
                  {
                    type: "button",
                    "aria-label": longDateLabel(cell.date),
                    "data-date": iso(cell.date),
                    ...cell.disabled ? { disabled: true } : {},
                    class: cellClass(cell),
                    onclick: () => select(cell.date)
                  },
                  cell.date.getDate()
                )
              )
            )
          )
        )
      )
    )
  );
  const renderCalendar = () => div7(
    {
      class: "p-3 w-72",
      tabindex: 0,
      onkeydown: handleGridKeydown
    },
    div7(
      { class: "flex items-center justify-between mb-2" },
      button5(
        {
          type: "button",
          class: "h-8 w-8 flex items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground cursor-pointer text-lg leading-none",
          "aria-label": () => prevMonthLabel.val,
          onclick: () => changeMonth(-1)
        },
        "\u2039"
      ),
      div7({ class: "font-semibold text-foreground text-sm" }, () => monthTitle.val),
      button5(
        {
          type: "button",
          class: "h-8 w-8 flex items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground cursor-pointer text-lg leading-none",
          "aria-label": () => nextMonthLabel.val,
          onclick: () => changeMonth(1)
        },
        "\u203A"
      )
    ),
    () => grid.val,
    div7(
      { class: "mt-2 flex justify-end" },
      button5(
        {
          type: "button",
          class: "px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-foreground hover:bg-primary/10 cursor-pointer",
          onclick: goToToday
        },
        () => todayLabel.val
      )
    )
  );
  const dom = () => {
    const errorText = van36.derive(
      () => field.isInvalid.val || field.isTouched.val && !!field.error.val ? field.error.val : ""
    );
    const inputCls = van36.derive(
      () => cx(
        "w-full px-3 py-2 border rounded-md text-sm transition-colors text-left focus:outline-none focus:ring-2",
        field.isInvalid.val ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-accent/30 focus:border-accent",
        disabled.val ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )
    );
    containerEl = div7(
      {
        class: () => cx("field datepicker relative flex flex-col gap-1", field.stateClass.val, props.class)
      },
      props.label ? label({ class: "font-medium text-foreground", for: name }, props.label) : null,
      input3({ type: "hidden", name, value: () => iso(selected.val) }),
      inline ? null : input3({
        id: name,
        type: "text",
        readOnly: true,
        class: inputCls,
        value: () => display.val,
        placeholder: props.placeholder ?? t("datepicker.placeholder", "Seleccionar fecha"),
        disabled: () => disabled.val,
        onfocus: () => setOpen(true),
        onclick: () => setOpen(true),
        onkeydown: handleInputKeydown
      }),
      inline ? renderCalendar() : div7(
        {
          class: () => cx(
            "datepicker-popup absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-background shadow-xl",
            open.val ? "" : "hidden"
          )
        },
        () => renderCalendar()
      ),
      p2(
        { class: () => errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden" },
        () => errorText.val
      )
    );
    return containerEl;
  };
  const field = createControlField(
    {
      name,
      value: van36.derive(() => iso(selected.val)),
      currentValue: () => iso(selected.val),
      applyValue: (rawStr) => {
        const d = parseIso(rawStr);
        if (d) {
          selected.val = d;
          syncViewTo(d);
          focused.val = d;
        }
      }
    },
    { dom },
    validators
  );
  return field;
};

// src/components/kbd.ts
import van37 from "vanjs-core";
var Kbd = (props = {}, ...children) => van37.tags.kbd(
  {
    class: cx(
      "inline-flex items-center justify-center rounded-md border border-border bg-secondary/30 font-mono font-semibold text-foreground shadow-2xs",
      props.size === "sm" ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-xs",
      props.class
    )
  },
  ...children
);

// src/debug.ts
import van38 from "vanjs-core";
var trace = (state, name) => {
  const label = name ?? "state";
  van38.derive(() => {
    console.log(`[vanuikit:trace] ${label} =`, state.val);
  });
  return state;
};
var VAN_BINDING_HINTS = `Pistas (gotchas de van):
  1. Un hijo-funci\xF3n que retorna null muere en el primer cambio (keepConnected
     descarta bindings con _dom null): usa un ancla siempre montada + hidden.
  2. Los \xE1rboles separados del documento pierden sus bindings: m\xF3ntalo en body.
  3. t()/fmt./rawText creados DENTRO de un binding no re-suscriben: iza el
     State fuera de la funci\xF3n.`;
var expectReactive = async (opts) => {
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  host.append(opts.render());
  opts.act();
  await (opts.tick?.() ?? new Promise((r) => setTimeout(r, 0)));
  const after = host.textContent ?? "";
  host.remove();
  if (opts.text !== void 0 && after !== opts.text) {
    throw new Error(
      `expectReactive: texto inesperado.
  esperado: ${JSON.stringify(opts.text)}
  recibido: ${JSON.stringify(after)}
${VAN_BINDING_HINTS}`
    );
  }
  if (opts.contains !== void 0 && !after.includes(opts.contains)) {
    throw new Error(
      `expectReactive: el \xE1rbol no reaccion\xF3 (no contiene ${JSON.stringify(opts.contains)}; recibido: ${JSON.stringify(after)}).
${VAN_BINDING_HINTS}`
    );
  }
};

// src/debug-graph.ts
var stateMeta = /* @__PURE__ */ new WeakMap();
var states = /* @__PURE__ */ new Map();
var stateSeq = 0;
var derives = [];
var diagnostics = [];
var silent = false;
var activeFrame = null;
var intentionalRender = /* @__PURE__ */ new WeakMap();
var hookedStates = /* @__PURE__ */ new WeakMap();
var installedApi;
function metaOf(state) {
  let m = stateMeta.get(state);
  if (!m) {
    m = { id: ++stateSeq, label: `state#${stateSeq}`, reads: 0 };
    stateMeta.set(state, m);
    states.set(m.id, m);
  }
  return m;
}
function captureCallSite() {
  const stack = new Error().stack?.split("\n") ?? [];
  for (const line of stack.slice(2)) {
    const t2 = line.trim();
    if (t2.startsWith("at ")) return t2;
  }
  return void 0;
}
function report(kind, message, origin) {
  const d = { kind, message, origin: origin ?? captureCallSite() };
  diagnostics.push(d);
  if (!silent) {
    console.warn(`[vanuikit:debug] ${kind} \u2014 ${message}`);
    if (d.origin) console.warn(`  en ${d.origin}`);
  }
}
function findValDescriptor(obj) {
  let cur = obj;
  while (cur) {
    const d = Object.getOwnPropertyDescriptor(cur, "val");
    if (d) return d;
    cur = Object.getPrototypeOf(cur);
  }
  return void 0;
}
function hookState(state, label) {
  if (hookedStates.has(state)) return state;
  hookedStates.set(state, true);
  const m = metaOf(state);
  if (label) m.label = label;
  const desc = findValDescriptor(state);
  if (!desc || !desc.get && !desc.set) return state;
  Object.defineProperty(state, "val", {
    configurable: true,
    enumerable: desc.enumerable ?? true,
    get() {
      if (activeFrame) activeFrame.deps.add(m);
      m.reads++;
      return desc.get ? desc.get.call(this) : void 0;
    },
    set(v) {
      if (activeFrame) activeFrame.writes.add(m);
      if (desc.set) desc.set.call(this, v);
    }
  });
  return state;
}
var deriveSeq = 0;
function installVanDebug(van49) {
  if (installedApi) return installedApi;
  let api;
  const origState = van49.state.bind(van49);
  const origDerive = van49.derive.bind(van49);
  van49.state = ((initVal, label) => {
    if (activeFrame) {
      report(
        "state-in-derive",
        `van.state() creado dentro de ${activeFrame.kind} "${activeFrame.label}" \u2014 el estado se recrear\xE1 en cada rec\xE1lculo y perder\xE1 su identidad. Iz\xE1 el estado fuera de la funci\xF3n.`
      );
    }
    return hookState(origState(initVal), label);
  });
  van49.derive = ((fn) => {
    const label = fn.name || `derive#${++deriveSeq}`;
    const frame = {
      kind: "derive",
      label,
      deps: /* @__PURE__ */ new Set(),
      writes: /* @__PURE__ */ new Set(),
      parent: activeFrame,
      origin: captureCallSite()
    };
    const derived = origDerive(() => {
      const prev = activeFrame;
      activeFrame = frame;
      try {
        return fn();
      } finally {
        activeFrame = prev;
      }
    });
    void derived.val;
    if (frame.deps.size === 0) {
      report(
        "derive-no-deps",
        `derive "${label}" no ley\xF3 ning\xFAn estado \u2014 no es reactivo (\xBFusa raw()/t().val que no registr\xF3 deps?).`,
        frame.origin
      );
    }
    if (frame.writes.size > 0) {
      report(
        "derive-writes-state",
        `derive "${label}" escribe estados durante su c\xF3mputo (${[...frame.writes].map((w) => w.label).join(", ")}) \u2014 feedback reactivo peligroso.`,
        frame.origin
      );
      for (const w of frame.writes) {
        if (frame.deps.has(w)) {
          report(
            "derive-cycle",
            `derive "${label}" lee y escribe el mismo estado "${w.label}" \u2014 ciclo de reactividad.`,
            frame.origin
          );
        }
      }
    }
    const depIds = [...frame.deps].map((m) => m.id);
    const writeIds = [...frame.writes].map((m) => m.id);
    derives.push({ id: derives.length + 1, label, deps: depIds, writes: writeIds });
    return derived;
  });
  api = {
    dump() {
      return {
        states: [...states.values()].map((m) => ({ id: m.id, label: m.label })),
        derives: derives.map((d) => ({ ...d, deps: [...d.deps], writes: [...d.writes] })),
        diagnostics: diagnostics.map((d) => ({ ...d }))
      };
    },
    printTree() {
      const byId = new Map(states.entries());
      console.group("[vanuikit:debug] \xE1rbol de dependencias");
      for (const d of derives) {
        const deps = d.deps.length ? d.deps.map((id) => byId.get(id)?.label ?? `#${id}`).join(", ") : "(sin deps)";
        const writes = d.writes.length ? ` [escribe: ${d.writes.map((id) => byId.get(id)?.label ?? `#${id}`).join(", ")}]` : "";
        console.log(`derive ${d.label} \u2192 ${deps}${writes}`);
      }
      console.groupEnd();
    },
    diagnostics() {
      return diagnostics;
    },
    clear() {
      states.clear();
      derives.length = 0;
      diagnostics.length = 0;
      stateSeq = 0;
      deriveSeq = 0;
    },
    trackRender(fn, label) {
      if (intentionalRender.has(fn)) return fn();
      const frame = {
        kind: "render",
        label: label ?? fn.name ?? "render",
        deps: /* @__PURE__ */ new Set(),
        writes: /* @__PURE__ */ new Set(),
        parent: activeFrame,
        origin: captureCallSite()
      };
      const prev = activeFrame;
      activeFrame = frame;
      let out;
      try {
        out = fn();
      } finally {
        activeFrame = prev;
      }
      if (frame.deps.size > 0) {
        report(
          "container-reactive-reads",
          `funci\xF3n de render "${frame.label}" ley\xF3 estados reactivos (${[...frame.deps].map((m) => m.label).join(", ")}) \u2014 reconstruir\xE1 su sub\xE1rbol al cambiar esos estados. Si es intencional, envuelve la funci\xF3n con renderIntentional().`,
          frame.origin
        );
      }
      return out;
    },
    renderIntentional(fn) {
      intentionalRender.set(fn, true);
      return fn;
    },
    configure(opts) {
      if (opts.silent !== void 0) silent = opts.silent;
    }
  };
  installedApi = api;
  return api;
}

// src/components/theme-toggle.ts
import van40 from "vanjs-core";

// src/theme.ts
import van39 from "vanjs-core";
function createTheme(options = {}) {
  const storageKey = options.storageKey ?? "vanuikit-theme";
  const defaultMode = options.defaultMode ?? "system";
  const getSavedMode = () => {
    if (typeof window === "undefined" || !window.localStorage) return defaultMode;
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
    return defaultMode;
  };
  const mode = van39.state(getSavedMode());
  const isSystemDark = van39.state(
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  );
  if (typeof window !== "undefined" && window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      isSystemDark.val = e.matches;
      applyTheme();
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else if ("addListener" in mediaQuery) {
      mediaQuery.addListener(handler);
    }
  }
  const isDark = van39.derive(() => {
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
  applyTheme();
  const setMode = (newMode) => {
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
    toggle
  };
}

// src/components/theme-toggle.ts
var TEXTS3 = {
  light: { key: "theme.light", default: "Claro" },
  dark: { key: "theme.dark", default: "Oscuro" },
  system: { key: "theme.system", default: "Sistema" },
  selectLabel: { key: "theme.selectLabel", default: "Seleccionar tema visual" },
  toggleLabel: { key: "theme.toggleLabel", default: "Alternar tema visual (Claro / Oscuro / Sistema)" },
  toggleTitle: { key: "theme.toggleTitle", default: "Alternar tema (Claro / Oscuro / Sistema)" }
};
var defaultThemeInstance = null;
function getDefaultTheme() {
  if (!defaultThemeInstance) {
    defaultThemeInstance = createTheme();
  }
  return defaultThemeInstance;
}
function ThemeToggle(props = {}) {
  const { button: button5, div: div7, span: span7 } = van40.tags;
  const theme = props.theme ?? getDefaultTheme();
  const i18n3 = props.i18n ?? i18n;
  const variant = props.variant ?? "button";
  const showLabel = props.showLabel ?? false;
  const includeSystem = props.includeSystem ?? true;
  if (variant === "segmented") {
    const modes = includeSystem ? [
      { mode: "light", icon: "sun", text: TEXTS3.light },
      { mode: "dark", icon: "moon", text: TEXTS3.dark },
      { mode: "system", icon: "monitor", text: TEXTS3.system }
    ] : [
      { mode: "light", icon: "sun", text: TEXTS3.light },
      { mode: "dark", icon: "moon", text: TEXTS3.dark }
    ];
    return div7(
      {
        class: cx(
          "inline-flex items-center p-1 rounded-xl bg-secondary/60 border border-border/80 gap-1",
          props.class
        ),
        role: "radiogroup",
        "aria-label": i18n3.t("theme.selectLabel", "Seleccionar tema visual")
      },
      modes.map(({ mode, icon, text }) => {
        const isActive = van40.derive(() => theme.mode.val === mode);
        return button5(
          {
            type: "button",
            role: "radio",
            "aria-checked": isActive,
            class: () => cx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer select-none",
              isActive.val ? "bg-card text-foreground shadow-xs border border-border/60" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
            ),
            onclick: () => theme.setMode(mode)
          },
          Icon({ name: icon }),
          showLabel ? span7(i18n3.t(text.key, text.default)) : null
        );
      })
    );
  }
  const cycle = () => {
    if (includeSystem) {
      if (theme.mode.val === "system") theme.setMode("dark");
      else if (theme.mode.val === "dark") theme.setMode("light");
      else theme.setMode("system");
    } else {
      theme.setMode(theme.mode.val === "dark" ? "light" : "dark");
    }
  };
  const getIcon = () => {
    if (theme.mode.val === "system") return "monitor";
    return theme.mode.val === "dark" ? "moon" : "sun";
  };
  const getLabel = () => {
    if (theme.mode.val === "system") return i18n3.t("theme.system", "Sistema");
    return theme.mode.val === "dark" ? i18n3.t("theme.dark", "Oscuro") : i18n3.t("theme.light", "Claro");
  };
  return button5(
    {
      type: "button",
      class: cx(
        "inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium cursor-pointer transition-colors shadow-xs select-none",
        props.class
      ),
      "aria-label": i18n3.t("theme.toggleLabel", "Alternar tema visual (Claro / Oscuro / Sistema)"),
      title: i18n3.t("theme.toggleTitle", "Alternar tema (Claro / Oscuro / Sistema)"),
      onclick: cycle
    },
    () => Icon({ name: getIcon() }),
    showLabel ? () => span7(getLabel()) : null
  );
}

// src/components/locale-selector.ts
import van41 from "vanjs-core";
var SVG_NS2 = "http://www.w3.org/2000/svg";
var { svg: svg2, rect, circle } = van41.tags(SVG_NS2);
var FLAG_SHAPES = {
  es: [
    { x: 0, y: 0, width: 24, height: 5, fill: "#aa151b" },
    { x: 0, y: 5, width: 24, height: 6, fill: "#f1bf00" },
    { x: 0, y: 11, width: 24, height: 5, fill: "#aa151b" }
  ],
  fr: [
    { x: 0, y: 0, width: 8, height: 16, fill: "#0055a4" },
    { x: 8, y: 0, width: 8, height: 16, fill: "#ffffff" },
    { x: 16, y: 0, width: 8, height: 16, fill: "#ef4135" }
  ],
  de: [
    { x: 0, y: 0, width: 24, height: 5.3, fill: "#000000" },
    { x: 0, y: 5.3, width: 24, height: 5.3, fill: "#dd0000" },
    { x: 0, y: 10.7, width: 24, height: 5.3, fill: "#ffce00" }
  ],
  it: [
    { x: 0, y: 0, width: 8, height: 16, fill: "#009246" },
    { x: 8, y: 0, width: 8, height: 16, fill: "#ffffff" },
    { x: 16, y: 0, width: 8, height: 16, fill: "#ce2b37" }
  ],
  pt: [
    { x: 0, y: 0, width: 24, height: 16, fill: "#009c3b" },
    { cx: 12, cy: 8, r: 6, fill: "#ffdf00" },
    { cx: 12, cy: 8, r: 3.5, fill: "#002776" }
  ],
  en: [
    { x: 0, y: 0, width: 24, height: 16, fill: "#ffffff" },
    { x: 0, y: 0, width: 24, height: 3.2, fill: "#b22234" },
    { x: 0, y: 6.4, width: 24, height: 3.2, fill: "#b22234" },
    { x: 0, y: 12.8, width: 24, height: 3.2, fill: "#b22234" },
    { x: 0, y: 0, width: 10, height: 8.6, fill: "#3c3b6e" }
  ]
};
function FlagIcon({ code }) {
  const shapes = FLAG_SHAPES[code];
  if (!shapes) return Icon({ name: "globe", class: "size-4" });
  return svg2(
    {
      viewBox: "0 0 24 16",
      class: "size-4 shrink-0 rounded-[2px] select-none",
      "aria-hidden": "true"
    },
    ...shapes.map(
      (s) => "r" in s ? circle({ cx: s.cx, cy: s.cy, r: s.r, fill: s.fill }) : rect({ x: s.x, y: s.y, width: s.width, height: s.height, fill: s.fill })
    )
  );
}
function LocaleSelector(props = {}) {
  const { select, option, div: div7, button: button5, span: span7 } = van41.tags;
  const i18n3 = props.i18n ?? i18n;
  const variant = props.variant ?? "select";
  const getOptions = () => {
    if (props.options && props.options.length > 0) {
      return props.options;
    }
    if (!i18n3.locales) return [];
    return Object.keys(i18n3.locales).map((code) => {
      const label = i18n3.locales[code]?.lang?.[code] || i18n3.locales["es"]?.lang?.[code] || code.toUpperCase();
      return { code, label };
    });
  };
  const optionsList = getOptions();
  if (variant === "buttons") {
    return div7(
      {
        class: cx(
          "inline-flex items-center p-1 rounded-xl bg-secondary/60 border border-border/80 gap-1",
          props.class
        ),
        role: "group",
        "aria-label": i18n3.t("locale.groupLabel", "Selector de idioma")
      },
      optionsList.map(({ code, label, flag }) => {
        const isActive = van41.derive(() => i18n3.currentLocale.val === code);
        return button5(
          {
            type: "button",
            class: () => cx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer select-none",
              isActive.val ? "bg-card text-foreground shadow-xs border border-border/60" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
            ),
            onclick: () => i18n3.setLocale(code)
          },
          FlagIcon({ code }),
          span7(label)
        );
      })
    );
  }
  return select(
    {
      class: cx(
        "text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground font-medium cursor-pointer transition-colors shadow-xs outline-none select-none hover:bg-secondary/50",
        props.class
      ),
      "aria-label": i18n3.t("locale.selectLabel", "Idioma / Language"),
      onchange: (e) => i18n3.setLocale(e.target.value),
      value: () => i18n3.currentLocale.val
    },
    optionsList.map(
      ({ code, label }) => option(
        {
          value: code,
          selected: () => i18n3.currentLocale.val === code
        },
        label
      )
    )
  );
}

// src/components/user-badge.ts
import van42 from "vanjs-core";
function UserBadge(props) {
  const { div: div7, span: span7, button: button5 } = van42.tags;
  const i18n3 = props.i18n ?? i18n;
  const showLogout = props.showLogout ?? true;
  const getUser = () => {
    if (props.auth) {
      return props.auth.user.val;
    }
    if (props.user) {
      if (typeof props.user === "object" && "val" in props.user) {
        return props.user.val;
      }
      return props.user;
    }
    return null;
  };
  const initialsOf = (u) => u.name ? getInitials(u.name, "U") : getInitials(u.email ?? "", "U");
  const handleLogout = async () => {
    if (props.auth) {
      await props.auth.logout();
    }
    if (props.onLogout) {
      await props.onLogout();
    }
  };
  return () => {
    const currentUser = getUser();
    if (!currentUser) {
      return div7({ class: "hidden", "aria-hidden": "true" });
    }
    const initials = initialsOf(currentUser);
    const displayName = typeof currentUser.name === "string" && currentUser.name ? currentUser.name : currentUser.email;
    const isCompact = typeof props.compact === "object" && props.compact !== null && "val" in props.compact ? props.compact.val : Boolean(props.compact);
    if (isCompact) {
      const logoutLabel = i18n3.raw("nav.logout", "Cerrar sesi\xF3n");
      return div7(
        { class: cx("flex flex-col items-center gap-2", props.class) },
        Avatar({ name: displayName, size: "sm" }),
        showLogout ? button5(
          {
            type: "button",
            class: "w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 transition cursor-pointer flex items-center justify-center text-sm select-none",
            "aria-label": logoutLabel,
            title: logoutLabel,
            onclick: handleLogout
          },
          Icon({ name: "log-out", class: "size-4" })
        ) : null
      );
    }
    return div7(
      {
        class: cx(
          "flex flex-col gap-2.5 p-3 rounded-xl bg-secondary/40 border border-border/50 transition-all",
          props.class
        )
      },
      div7(
        { class: "flex items-center gap-2.5 min-w-0" },
        Avatar({ name: displayName, size: "xs" }),
        div7(
          { class: "flex flex-col min-w-0 flex-1" },
          span7(
            { class: "text-xs font-semibold text-foreground truncate", title: displayName },
            displayName
          ),
          span7(
            { class: "text-[10px] text-muted-foreground truncate" },
            props.statusText ? props.statusText : i18n3.raw("user.sessionActive", "Sesi\xF3n activa")
          )
        )
      ),
      showLogout ? button5(
        {
          type: "button",
          class: "w-full text-xs font-medium py-1.5 px-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 transition cursor-pointer text-center select-none",
          onclick: handleLogout
        },
        Icon({ name: "log-out", class: "size-3.5" }),
        " ",
        i18n3.t("nav.logout", "Cerrar sesi\xF3n")
      ) : null
    );
  };
}

// src/pages/login.ts
import van43 from "vanjs-core";
var LoginForm = (info) => {
  const { div: div7, p: p2 } = van43.tags;
  const msg = van43.state(null);
  const form = Form({
    onSubmit: async (data) => {
      const result = await info.handleLogin(data);
      if (result && "error" in result && result.error) {
        return { ok: false, error: result.error };
      }
      return { ok: true };
    },
    onBeforeSubmit: () => {
      msg.val = Spin(t("login.loading", "Iniciando sesi\xF3n..."));
    },
    onError: () => {
      msg.val = null;
    },
    onSuccess: () => {
      msg.val = null;
    }
  });
  const email = EmailField();
  const password = PasswordField();
  form.add(email, password);
  return div7(
    {},
    () => form.error.val ? p2({ class: "text-destructive text-sm mb-3" }, form.error.val) : "",
    form.dom(
      div7(
        { class: "pt-2" },
        () => msg.val && msg.val || Button(
          { type: "submit", disabled: form.submitting.val },
          t("login.submit", "Iniciar sesi\xF3n")
        )
      )
    )
  );
};

// src/pages/register.ts
import van44 from "vanjs-core";
var RegisterForm = (info) => {
  const { div: div7, p: p2 } = van44.tags;
  const msg = van44.state(null);
  const form = Form({
    onSubmit: async (data) => {
      const result = await info.handleRegister(data);
      if (result && "error" in result && result.error) {
        return { ok: false, error: result.error };
      }
      return { ok: true };
    },
    onBeforeSubmit: () => {
      msg.val = Spin(t("register.loading", "Creando cuenta..."));
    },
    onError: () => {
      msg.val = null;
    },
    onSuccess: () => {
      msg.val = null;
    }
  });
  const name = TextField({ name: "name" });
  const email = EmailField();
  const password = PasswordField();
  const confirm = PasswordField({
    name: "confirm",
    label: t("field.confirm.label", "Confirmar contrase\xF1a"),
    placeholder: t("field.confirm.placeholder", "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"),
    requiredMsg: t("field.confirm.required", "Confirma tu contrase\xF1a")
  }).addValidator(Match("password", t("field.confirm.mismatch", "Las contrase\xF1as no coinciden")));
  form.add(name, email, password, confirm);
  return div7(
    {},
    () => form.error.val ? p2({ class: "text-destructive text-sm mb-3" }, form.error.val) : "",
    form.dom(
      div7(
        { class: "pt-2" },
        () => msg.val && msg.val || Button(
          { type: "submit", disabled: form.submitting.val },
          t("register.submit", "Crear cuenta")
        )
      )
    )
  );
};

// src/auth.ts
import van45 from "vanjs-core";
function createAuth(api, options) {
  const user = van45.state(null);
  const status = van45.state("idle");
  const tokenState = van45.state(null);
  const storageKey = options?.storageKey !== void 0 ? options.storageKey : "session_token";
  const readPersistedToken = () => {
    if (!storageKey || typeof localStorage === "undefined") return null;
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };
  const persistToken = (tok) => {
    tokenState.val = tok || null;
    if (!storageKey || typeof localStorage === "undefined") return;
    try {
      if (tok) {
        localStorage.setItem(storageKey, tok);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
    }
  };
  const initialToken = readPersistedToken();
  if (initialToken) {
    tokenState.val = initialToken;
  }
  let inFlightBoot = null;
  const setSession = (u, tok) => {
    user.val = u;
    status.val = u ? "authenticated" : "unauthenticated";
    if (tok !== void 0) {
      persistToken(tok);
    } else if (!u) {
      persistToken(null);
    }
  };
  const boot = async () => {
    if (inFlightBoot) {
      return inFlightBoot;
    }
    status.val = "checking";
    inFlightBoot = (async () => {
      try {
        const res = await api.me();
        user.val = res.user;
        status.val = res.user ? "authenticated" : "unauthenticated";
        if (res.token !== void 0) {
          persistToken(res.token);
        } else if (!res.user) {
          persistToken(null);
        }
        return res.user;
      } catch {
        status.val = "unauthenticated";
        persistToken(null);
        return null;
      } finally {
        inFlightBoot = null;
      }
    })();
    return inFlightBoot;
  };
  const login = async (email, password) => {
    const res = await api.login(email, password);
    setSession(res.user, res.token);
    return res;
  };
  const register = async (data) => {
    if (!api.register) {
      throw new Error("El m\xE9todo register no est\xE1 implementado en AuthApi");
    }
    const res = await api.register(data);
    setSession(res.user, res.token);
    return res;
  };
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setSession(null, null);
    }
  };
  return {
    user,
    status,
    token: tokenState,
    boot,
    login,
    register,
    logout,
    setSession,
    getToken: () => tokenState.val || readPersistedToken(),
    isAuthenticated: () => user.val !== null
  };
}
function requireAuth(auth, redirect = "/login") {
  return async () => {
    if (auth.status && (auth.status.val === "idle" || auth.status.val === "checking")) {
      if (typeof auth.boot === "function") {
        await auth.boot();
      }
    }
    return auth.user.val ? true : redirect;
  };
}

// src/fetch.ts
import van46 from "vanjs-core";
function getStoredAuthHeaders() {
  try {
    if (typeof localStorage !== "undefined") {
      const token = localStorage.getItem("session_token");
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
  } catch {
  }
  return {};
}
function createQuery(url, options = {}) {
  const { transform, immediate = true, init } = options;
  const data = van46.state(null);
  const loading = van46.state(immediate);
  const error = van46.state(null);
  const status = van46.state(null);
  const fetcher = async () => {
    loading.val = true;
    error.val = null;
    try {
      const targetUrl = typeof url === "function" ? url() : url;
      const fetchInit = typeof init === "function" ? init() : init;
      const authHeaders = getStoredAuthHeaders();
      const res = await fetch(targetUrl, {
        credentials: "include",
        ...fetchInit,
        headers: {
          Accept: "application/json",
          ...authHeaders,
          ...fetchInit?.headers || {}
        }
      });
      status.val = res.status;
      if (!res.ok) {
        let errMessage = `Error ${res.status}: ${res.statusText}`;
        try {
          const body = await res.json();
          if (body && (body.error || body.message)) {
            errMessage = body.error || body.message;
          }
        } catch {
        }
        throw new Error(errMessage);
      }
      const json = await res.json();
      const parsedData = transform ? transform(json) : json;
      data.val = parsedData;
      return parsedData;
    } catch (err) {
      error.val = err.message || "Error al realizar la petici\xF3n";
      return null;
    } finally {
      loading.val = false;
    }
  };
  if (immediate) {
    fetcher();
  }
  const setData = (val) => {
    data.val = val;
  };
  return {
    data,
    loading,
    error,
    status,
    refetch: fetcher,
    setData
  };
}
function createMutation(urlOrFn, options = {}) {
  const data = van46.state(null);
  const loading = van46.state(false);
  const error = van46.state(null);
  const mutate = async (variables) => {
    loading.val = true;
    error.val = null;
    try {
      let result;
      if (typeof urlOrFn === "function" && urlOrFn.length === 1 && typeof urlOrFn(variables) !== "string") {
        result = await urlOrFn(variables);
      } else {
        const targetUrl = typeof urlOrFn === "function" ? urlOrFn(variables) : urlOrFn;
        const fetchInit = typeof options.init === "function" ? options.init() : options.init;
        const authHeaders = getStoredAuthHeaders();
        const res = await fetch(targetUrl, {
          method: "POST",
          credentials: "include",
          ...fetchInit,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...authHeaders,
            ...fetchInit?.headers || {}
          },
          body: JSON.stringify(variables)
        });
        if (!res.ok) {
          let errMessage = `Error ${res.status}: ${res.statusText}`;
          try {
            const body = await res.json();
            if (body && (body.error || body.message)) {
              errMessage = body.error || body.message;
            }
          } catch {
          }
          throw new Error(errMessage);
        }
        result = await res.json();
      }
      data.val = result;
      options.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const msg = err.message || "Error al ejecutar la acci\xF3n";
      error.val = msg;
      options.onError?.(err, variables);
      return null;
    } finally {
      loading.val = false;
    }
  };
  const reset = () => {
    data.val = null;
    loading.val = false;
    error.val = null;
  };
  return {
    mutate,
    data,
    loading,
    error,
    reset
  };
}

// src/fmt.ts
import van47 from "vanjs-core";
var toDate = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};
var fmtDate = (locale, value, opts) => {
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", ...opts }).format(d);
};
var fmtTime = (locale, value, opts) => {
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(locale, { timeStyle: "short", ...opts }).format(d);
};
var fmtNumber = (locale, value, opts) => new Intl.NumberFormat(locale, opts).format(value);
var fmtCurrency = (locale, value, opts) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", ...opts }).format(value);
var fmtPercent = (locale, value, opts) => new Intl.NumberFormat(locale, { style: "percent", ...opts }).format(value);
var fmtRelative = (locale, value, unit, opts) => new Intl.RelativeTimeFormat(locale, { numeric: "auto", ...opts }).format(value, unit);
function createFmt(i18n3 = i18n) {
  const withLocale = (compute) => van47.derive(() => {
    void i18n3.currentLocale.val;
    return compute(i18n3.currentLocale.val);
  });
  const reactive = {
    date: (value, opts) => withLocale((locale) => fmtDate(locale, value, opts)),
    datetime: (value, opts) => withLocale((locale) => fmtDate(locale, value, { timeStyle: "short", ...opts })),
    time: (value, opts) => withLocale((locale) => fmtTime(locale, value, opts)),
    number: (value, opts) => withLocale((locale) => fmtNumber(locale, value, opts)),
    currency: (value, opts) => withLocale((locale) => fmtCurrency(locale, value, opts)),
    percent: (value, opts) => withLocale((locale) => fmtPercent(locale, value, opts)),
    relative: (value, unit, opts) => withLocale((locale) => fmtRelative(locale, value, unit, opts))
  };
  const raw2 = {
    date: (value, opts) => fmtDate(i18n3.currentLocale.val, value, opts),
    datetime: (value, opts) => fmtDate(i18n3.currentLocale.val, value, { timeStyle: "short", ...opts }),
    time: (value, opts) => fmtTime(i18n3.currentLocale.val, value, opts),
    number: (value, opts) => fmtNumber(i18n3.currentLocale.val, value, opts),
    currency: (value, opts) => fmtCurrency(i18n3.currentLocale.val, value, opts),
    percent: (value, opts) => fmtPercent(i18n3.currentLocale.val, value, opts),
    relative: (value, unit, opts) => fmtRelative(i18n3.currentLocale.val, value, unit, opts)
  };
  return { ...reactive, raw: raw2 };
}
var fmt = createFmt(i18n);
export {
  Accordion,
  Alert,
  AppShell,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardTitle,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DataGrid,
  DatePicker,
  Drawer,
  DropdownMenu,
  Email,
  EmailField,
  EmptyState,
  Field,
  Form,
  HeaderBar,
  Icon,
  Kbd,
  Link,
  LocaleSelector,
  LoginForm,
  Match,
  MinLength,
  Modal,
  ModalBase,
  Nav,
  Pagination,
  PasswordField,
  Popover,
  PrimaryButton,
  Progress,
  RadioGroup,
  RegisterForm,
  Required,
  Router,
  SecondaryButton,
  SelectDropdown,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Skeleton,
  Spin,
  SpinModal,
  Svg,
  SvgPath,
  Switch,
  Table,
  Tabs,
  TextField,
  TextareaField,
  ThemeToggle,
  Tooltip,
  UserBadge,
  Wizard,
  confirmDialog,
  createAuth,
  createFmt,
  createI18n,
  createMutation,
  createQuery,
  createRouter,
  createTheme,
  cx,
  expectReactive,
  fmt,
  getActiveRouter,
  getInitials,
  i18n,
  installVanDebug,
  navigate,
  pageSlots,
  raw,
  requireAuth,
  setActiveRouter,
  t,
  toast,
  trace,
  van48 as van
};
