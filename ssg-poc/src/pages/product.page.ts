// ssg-poc/src/pages/product.page.ts
/**
 * Detalle de producto — página pública indexable con interactividad.
 *
 * Además del patrón createQuery + seed del catálogo, prueba que la
 * REACTIVIDAD queda viva tras el takeover: los controles de cantidad son
 * van.state + bindings, y funcionan igual sobre el HTML servido por el CDN.
 *
 * El <head> (title/description con el nombre del producto) se aplica vía
 * van.derive: corre al renderizar y se re-aplica cuando llega la data —
 * así el title SEO correcto existe tanto en build como en navegación SPA.
 */
import { van, Button, Badge, Card, CardTitle, Spin, createQuery, raw, fmt, getActiveRouter } from "vanui";
import type { RouteContext } from "vanui";
import type { ChildDom } from "vanjs-core";
import { ensureLocale } from "../locale.js";
import { localize, type Product } from "../catalog.js";
import { getSeed } from "../data.js";
import { applyHead } from "../head.js";
import { Layout } from "../layout.js";
import { asNode } from "../node.js";
import { NotFoundView } from "./not-found.page.js";

export const ProductPage = (ctx: RouteContext): ChildDom => {
  const { div, h2, p, img, strong, span } = van.tags;

  const locale = ensureLocale(ctx.params.locale);
  if (!locale) return NotFoundView("es");

  const slug = ctx.params.slug;
  const apiPath = `/api/products/${slug}`;

  const q = createQuery<Product>(apiPath, { transform: (json: any) => json.data, immediate: false });
  const pre = getSeed<Product>(apiPath);

  const qty = van.state(1);

  // Head: se aplica al renderizar (title genérico) y se re-aplica UNA vez
  // cuando llega la data (title del producto — el SEO que indexa Google es
  // el serializado en build, ya con datos).
  //
  // NO es un van.derive: un derive con efecto vive atado a sus inputs y se
  // re-ejecutaría ante cambios de estado GLOBAL (p. ej. currentLocale)
  // DESPUÉS de que el usuario navegó a otra ruta, pisando el head de la
  // página nueva. La promesa de refetch es one-shot; el guard de ruta
  // descarta la resolución si el usuario ya se fue.
  const syncHead = (product: Product | null) =>
    applyHead({
      title: product
        ? `${localize(product, locale).name} · ${raw("site.title", "Tienda VanUI")}`
        : `${raw("site.loading", "Cargando…")} · ${raw("site.title", "Tienda VanUI")}`,
      description: product
        ? localize(product, locale).description
        : raw("site.catalogDesc", "Catálogo de productos de la tienda VanUI."),
      path: ctx.to,
      locale,
    });

  syncHead(pre ?? null);
  if (pre) {
    q.setData(pre);
  } else {
    void q.refetch().then((product) => {
      if (product && getActiveRouter()?.path.val === ctx.to) syncHead(product);
    });
  }

  const detailCard = (product: Product): ChildDom => {
    const { name, description } = localize(product, locale);
    return Card(
      { class: "product-card product-detail" },
      img({ src: product.image, alt: name, width: "96", height: "96" }),
      div(
        { class: "product-body" },
        h2(name),
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
        div(
          { class: "qty-controls", "aria-label": raw("site.quantity", "Cantidad") },
          Button(
            {
              variant: "secondary",
              size: "sm",
              class: "qty-btn", // site.css lo compacta (Button es w-full por diseño)
              "aria-label": raw("site.decrease", "Disminuir cantidad"),
              onclick: () => {
                qty.val = Math.max(1, qty.val - 1);
              },
            },
            "−",
          ),
          span({ class: "qty-value" }, () => qty.val),
          Button(
            {
              variant: "secondary",
              size: "sm",
              class: "qty-btn",
              "aria-label": raw("site.increase", "Aumentar cantidad"),
              onclick: () => {
                qty.val += 1;
              },
            },
            "+",
          ),
        ),
        Button({ variant: "primary" }, raw("site.addToCart", "Agregar al carrito")),
      ),
    );
  };

  return Layout(
    locale,
    div(
      {
        class: "catalog",
        // Conmuta el VALOR (no la presencia): van escribe "null" como
        // atributo si el binding devuelve null, no lo elimina.
        "data-loading": () => (q.data.val || q.error.val ? "false" : "true"),
      },
      () => {
        const product = q.data.val;
        if (product) return asNode(detailCard(product));
        if (q.error.val) return asNode(NotFoundView(locale));
        return div({ class: "loading-state" }, Spin(raw("site.loading", "Cargando…")));
      },
    ),
  );
};
