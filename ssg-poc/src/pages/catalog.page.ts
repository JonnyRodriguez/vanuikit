// ssg-poc/src/pages/catalog.page.ts
/**
 * Catálogo — página pública indexable.
 *
 * Mismo código para build y runtime:
 *   · createQuery (vanui) resuelve /api/products — en build el fetch lo
 *     resuelve el mock con latencia real (prueba de que el código async del
 *     cliente SÍ corre durante el SSG).
 *   · getSeed(): si el payload embebido trae datos (cliente tras takeover),
 *     se setean ANTES del primer render → el remount produce el mismo DOM
 *     que el HTML estático, sin flash de skeleton.
 *   · `data-loading` marca la zona de contenido: waitForReady() (build) la
 *     espera antes de serializar.
 */
import { van, Link, Badge, Card, CardTitle, Spin, createQuery, raw, fmt } from "vanui";
import type { RouteContext } from "vanui";
import type { ChildDom } from "vanjs-core";
import { ensureLocale } from "../locale.js";
import { localize, type Product } from "../catalog.js";
import { getSeed } from "../data.js";
import { applyHead } from "../head.js";
import { Layout } from "../layout.js";
import { NotFoundView } from "./not-found.page.js";

const API_PATH = "/api/products";

export const CatalogPage = (ctx: RouteContext): ChildDom => {
  const { div, h1, ul, li, img, p, strong } = van.tags;

  const locale = ensureLocale(ctx.params.locale);
  if (!locale) return NotFoundView("es");

  const q = createQuery<Product[]>(API_PATH, { transform: (json: any) => json.data });
  const pre = getSeed<Product[]>(API_PATH);
  if (pre) q.setData(pre);

  applyHead({
    title: `${raw("site.catalogTitle", "Catálogo")} · ${raw("site.title", "Tienda VanUI")}`,
    description: raw("site.catalogDesc", "Catálogo de productos de la tienda VanUI."),
    path: ctx.to,
    locale,
  });

  return Layout(
    locale,
    h1(raw("site.catalogTitle", "Catálogo")),
    div(
      {
        class: "catalog",
        // Conmuta el VALOR (no la presencia): van escribe "null" como
        // atributo si el binding devuelve null, no lo elimina.
        "data-loading": () => (q.data.val ? "false" : "true"),
      },
      () => {
        const products = q.data.val;
        if (!products) {
          return div({ class: "loading-state" }, Spin(raw("site.loading", "Cargando…")));
        }
        return ul(
          { class: "product-grid" },
          products.map((product): ChildDom => {
            const { name, description } = localize(product, locale);
            return li(
              Card(
                { class: "product-card" },
                img({ src: product.image, alt: name, width: "96", height: "96" }),
                CardTitle({}, name),
                p({ class: "product-desc" }, description),
                p(
                  { class: "product-meta" },
                  Badge({
                    variant: product.stock > 0 ? "success" : "danger",
                    text: product.stock > 0
                      ? raw("site.inStock", "En stock")
                      : raw("site.outStock", "Agotado"),
                  }),
                  strong(fmt.raw.currency(product.price, { currency: product.currency })),
                ),
                Link(
                  { href: `/${locale}/producto/${product.slug}`, variant: "accent" },
                  raw("site.viewProduct", "Ver detalle →"),
                ),
              ),
            );
          }),
        );
      },
    ),
  );
};
