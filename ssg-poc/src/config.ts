// ssg-poc/src/config.ts
/**
 * Configuración del sitio. SITE_URL es el origen canónico del despliegue
 * (CDN): el SSG lo usa para canonical/hreflang — NUNCA se deriva del host
 * del proceso de build (el bug `http://localhost` de la POC #1, corregido
 * de raíz: aquí el origin lo controla el config, no `c.req.url`).
 */
export const SITE_URL = process.env.SITE_URL ?? "https://vanui-ssg.example.com";

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

export const isLocale = (v: string): v is Locale =>
  (LOCALES as readonly string[]).includes(v);
