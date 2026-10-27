// ssg-poc/src/app.ts
/**
 * App — router vanui REAL (createRouter, sin cambios en la librería).
 *
 * boot() corre en DOS contextos con el mismo código:
 *   · Build (scripts/ssg-core.ts): happy-dom + fetch mockeado → el router
 *     resuelve la ruta, las queries cargan y el SSG serializa el DOM.
 *   · Cliente (src/client.ts): lee el payload embebido y REMONTA sobre el
 *     HTML estático — replaceChildren() del contenedor + van.add de la vista
 *     fresca. Como los seeds garantizan el mismo DOM, el swap es
 *     imperceptible (sin flash).
 */
import { van, createRouter, type Router } from "vanui";
import { DEFAULT_LOCALE } from "./config.js";
import { registerSiteTranslations } from "./i18n.js";
import { asNode } from "./node.js";
import { CatalogPage } from "./pages/catalog.page.js";
import { ProductPage } from "./pages/product.page.js";
import { NotFoundView } from "./pages/not-found.page.js";

registerSiteTranslations();

/** Monta la app en #app y devuelve el router (para tests). */
export const boot = (): Router => {
  // Sitio público: sin guard — todo el árbol es indexable. Si un día hay
  // rutas de app, aquí va deny-by-default (guard + publicRoutes) y esas
  // rutas simplemente NO se pre-renderizan: el CDN las manda al shell.
  const router = createRouter();

  router.redirect("/", `/${DEFAULT_LOCALE}/productos`);
  router.add("/:locale/productos", (ctx) => asNode(CatalogPage(ctx)));
  router.add("/:locale/producto/:slug", (ctx) => asNode(ProductPage(ctx)));
  router.setNotFound(() => asNode(NotFoundView(DEFAULT_LOCALE)));

  const root = document.getElementById("app");
  const view = router.start();
  if (root) {
    // TAKEOVER: el HTML estático ya pinta la página (SEO + first paint);
    // al arrancar el JS se reemplaza por un render fresco e idéntico
    // (garantizado por los seeds) — el usuario no ve el cambio.
    root.replaceChildren();
    van.add(root, view);
  }
  return router;
};
