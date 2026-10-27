// ssr-poc/server/ssr.ts
/**
 * SSR app — prueba de concepto de renderizado server-side.
 *
 * i18n por URL: cada idioma es un prefijo de ruta (`/es/...`, `/en/...`).
 *   · Slugs canónicos (no se traducen).
 *   · Las rutas sin prefijo redirigen (301) al locale por defecto.
 *   · El locale se fija antes de renderizar y se serializa en el HTML
 *     (`<html lang>` + `data-locale`) para que la hidratación lo retome.
 *   · SEO: canonical + hreflang alternates por idioma.
 */
import { Hono } from "hono";
import van from "mini-van-plate/van-plate";
import { registerEnv } from "mini-van-plate/shared";
import { PRODUCTS } from "../src/catalog.js";
import { ProductCard } from "../src/product-card.js";
import { LOCALES, DEFAULT_LOCALE, isLocale, t, type Locale } from "../src/i18n.js";

// URL del bundle de hidratación (sirvido estáticamente).
export const HYDRATE_BUNDLE = "/dist/ssr-hydrate.js";
export { LOCALES, DEFAULT_LOCALE };
export type { Locale };

registerEnv({ van });

const { head, body, html, title, meta, link, script, main, section, h1, ul, li, a } =
  van.tags;

const localize = (p: (typeof PRODUCTS)[number], l: Locale) => ({
  name: p.nameByLocale?.[l] ?? p.name,
  description: p.descriptionByLocale?.[l] ?? p.description,
});

const textsOf = (l: Locale) => ({
  addToCart: t(l, "addToCart"),
  quantityLabel: t(l, "quantity"),
  increaseLabel: t(l, "increase"),
  decreaseLabel: t(l, "decrease"),
});

const notFoundHtml = (l: Locale) =>
  van.html(
    head(title(t(l, "notFoundTitle"))),
    body(
      { "data-locale": l },
      main(
        h1(t(l, "notFoundTitle")),
        a({ href: `/${l}/productos` }, t(l, "notFoundBack")),
      ),
    ),
  );

export const makeSsrApp = (): Hono => {
  const app = new Hono();

  // Sin prefijo de idioma -> 301 al locale por defecto.
  app.get("/producto/:slug", (c) =>
    c.redirect(`/${DEFAULT_LOCALE}/producto/${c.req.param("slug")}`, 301),
  );
  app.get("/productos", (c) => c.redirect(`/${DEFAULT_LOCALE}/productos`, 301));

  // Catálogo localizado.
  app.get("/:locale/productos", (c) => {
    const l = c.req.param("locale")!;
    if (!isLocale(l)) return c.redirect(`/${DEFAULT_LOCALE}/productos`, 301);
    const doc = van.html(
      head(
        title(t(l, "catalogTitle")),
        link({ rel: "stylesheet", href: "/assets/style.css" }),
      ),
      body(
        { "data-locale": l },
        main(
          h1(t(l, "catalogTitle")),
          ul(PRODUCTS.map((p) => li(a({ href: `/${l}/producto/${p.slug}` }, p.name)))),
        ),
        script({ type: "module", src: HYDRATE_BUNDLE }),
      ),
    );
    return c.html(doc);
  });

  // Página de producto localizada (SSR): contenido completo -> SEO.
  app.get("/:locale/producto/:slug", (c) => {
    const l = c.req.param("locale")!;
    const slug = c.req.param("slug")!;
    if (!isLocale(l)) {
      return c.redirect(`/${DEFAULT_LOCALE}/producto/${slug}`, 301);
    }
    const product = PRODUCTS.find((p) => p.slug === slug);
    if (!product) return c.html(notFoundHtml(l), 404);

    const localized = localize(product, l);
    const origin = new URL(c.req.url).origin;
    const alternates = LOCALES.map(
      (alt) =>
        link({
          rel: "alternate",
          hreflang: alt,
          href: `${origin}/${alt}/producto/${product.slug}`,
        }),
    );

    const doc = van.html(
      head(
        title(`${localized.name} · Tienda VanUI`),
        meta({ name: "description", content: localized.description }),
        link({ rel: "canonical", href: `${origin}/${l}/producto/${product.slug}` }),
        ...alternates,
        link({ rel: "stylesheet", href: "/assets/style.css" }),
      ),
      body(
        { "data-locale": l },
        main(
          h1(t(l, "title")),
          section(
            ProductCard({
              ...product,
              ...localized,
              texts: textsOf(l),
            }),
          ),
        ),
        script({ type: "module", src: HYDRATE_BUNDLE }),
      ),
    );
    return c.html(doc);
  });

  return app;
};
