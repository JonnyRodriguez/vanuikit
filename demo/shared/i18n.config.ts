import { i18n } from "vanuikit";
import es from "./locales/es.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

/**
 * Language names (`lang.<code>` convention consumed by LocaleSelector).
 * Anchors TEXTS so that `i18n:collect` keeps them in the dictionaries.
 */
export const LANGUAGE_NAMES = [
  { key: "lang.es", default: "Español" },
  { key: "lang.en", default: "English" },
  { key: "lang.fr", default: "Français" },
] as const;

export const locales: Record<string, Record<string, unknown>> = { es, en, fr };

// Register the app's translations in the global i18n singleton
i18n.addTranslations(locales);

export { i18n };
