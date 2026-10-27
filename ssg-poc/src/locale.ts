// ssg-poc/src/locale.ts
import { i18n } from "vanui";
import { isLocale, type Locale } from "./config.js";

/**
 * Valida el :locale de la ruta y lo fija en el singleton i18n de vanui
 * ANTES de crear los bindings de t(). setLocale también sincroniza
 * `<html lang>` — el SSG lo serializa y el navegador lo lee.
 */
export const ensureLocale = (value: string | undefined): Locale | null => {
  const v = value ?? "";
  if (!isLocale(v)) return null;
  i18n.setLocale(v);
  return v;
};
