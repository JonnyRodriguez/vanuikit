// ssg-poc/scripts/sitemap.mjs
/**
 * Generador de sitemap.xml compartido por el build completo (ssg.mjs) y el
 * pipeline incremental (incremental.mjs): todas las URLs × locales, con
 * alternates hreflang por página (el estándar para i18n por URL).
 */
import { writeFileSync } from "node:fs";

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const swapLocale = (path, locale) => path.replace(/^\/[^/]+/, `/${locale}`);

/** Construye el XML del sitemap. slugs = lista completa de slugs del catálogo. */
export const buildSitemap = ({ siteUrl, locales, slugs }) => {
  const paths = [];
  for (const locale of locales) {
    paths.push(`/${locale}/productos`);
    for (const slug of slugs) paths.push(`/${locale}/producto/${slug}`);
  }

  const urls = paths.map((path) => {
    const alternates = [
      ...locales.map((l) =>
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(siteUrl)}${escapeXml(swapLocale(path, l))}"/>`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(siteUrl)}${escapeXml(swapLocale(path, "es"))}"/>`,
    ].join("\n");
    return `  <url>\n    <loc>${escapeXml(siteUrl)}${escapeXml(path)}</loc>\n${alternates}\n  </url>`;
  });

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls.join("\n")}\n</urlset>\n`
  );
};

export const writeSitemap = (distPath, config) =>
  writeFileSync(distPath, buildSitemap(config));
