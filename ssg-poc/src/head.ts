// ssg-poc/src/head.ts
/**
 * Gestión del <head> para SEO: title, meta description, canonical y
 * hreflang alternates — por página y por locale.
 *
 * Se usa IGUAL en build (el SSG serializa el head resultante) y en runtime
 * (navegación SPA: cada fábrica de ruta re-aplica el head). Los helpers
 * REUSAN los elementos existentes (querySelector antes de crear) para no
 * acumular tags entre navegaciones.
 */
import { SITE_URL, LOCALES, DEFAULT_LOCALE, type Locale } from "./config.js";

export interface HeadInfo {
  title: string;
  description: string;
  /** Path COMPLETO con locale (p. ej. "/es/productos"). */
  path: string;
  locale: Locale;
}

/** Path con el prefijo de locale reemplazado. */
export const localizedPath = (path: string, locale: Locale): string =>
  path.replace(/^\/[^/]+/, `/${locale}`);

const setMeta = (name: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const setAlternate = (hreflang: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`,
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const applyHead = ({ title, description, path, locale }: HeadInfo) => {
  document.title = title;
  setMeta("description", description);
  setCanonical(`${SITE_URL}${path}`);
  for (const alt of LOCALES) {
    setAlternate(alt, `${SITE_URL}${localizedPath(path, alt)}`);
  }
  setAlternate("x-default", `${SITE_URL}${localizedPath(path, DEFAULT_LOCALE)}`);
};
