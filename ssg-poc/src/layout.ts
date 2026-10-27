// ssg-poc/src/layout.ts
/**
 * Layout del sitio: header con marca + selector de idioma POR URL (el link
 * del otro locale navega a su árbol — el locale vive en la URL, no en
 * localStorage) y main.
 *
 * Todo con componentes vanui reales (Link compone la navegación SPA).
 */
import type { ChildDom } from "vanjs-core"; // type-only: se borra en build, no crea otra instancia de van
import { van, Link, raw } from "vanui";
import { LOCALES, type Locale } from "./config.js";

export const Layout = (locale: Locale, ...content: ChildDom[]): ChildDom => {
  const { div, header, nav, main, footer } = van.tags;

  return div(
    { class: "site" },
    header(
      { class: "site-header" },
      Link({ href: `/${locale}/productos`, variant: "none", class: "brand" }, "🛍️ VanUI"),
      nav(
        { class: "lang-switch", "aria-label": "Language" },
        LOCALES.map((l) =>
          Link(
            { href: `/${l}/productos`, variant: "none", class: l === locale ? "lang active" : "lang" },
            l.toUpperCase(),
          ),
        ),
      ),
    ),
    main({ class: "site-main" }, ...content),
    footer({ class: "site-footer" }, raw("site.footer", "POC SSG — vanui intacta.")),
  );
};
