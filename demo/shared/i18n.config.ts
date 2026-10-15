import { i18n } from "vanui";
import es from "./locales/es.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

/**
 * Nombres de idioma (convención `lang.<code>` que consume LocaleSelector).
 * Ancla TEXTS para que `i18n:collect` los mantenga en los diccionarios.
 */
export const LANGUAGE_NAMES = [
  { key: "lang.es", default: "Español" },
  { key: "lang.en", default: "English" },
  { key: "lang.fr", default: "Français" },
] as const;

export const locales: Record<string, Record<string, unknown>> = { es, en, fr };

// Se registran las traducciones de la app en el singleton global de i18n
i18n.addTranslations(locales);

export { i18n };
