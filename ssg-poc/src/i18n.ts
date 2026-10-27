// ssg-poc/src/i18n.ts
/**
 * Textos del sitio sobre el singleton i18n de vanui (t()/raw()/fmt).
 *
 * El locale vive en la URL (i18n por URL), así que AMBOS diccionarios están
 * registrados y completos: la resolución t() es dict[locale] → dict[
 * defaultLocale=en] → default inline. Si faltara el diccionario es, la
 * página en español resolvería por el EN (defaultLocale) y saldría en
 * inglés — por eso el ES no puede depender sólo del default inline.
 *
 * En demo estos diccionarios los gestiona el tooling (i18n:collect sobre
 * los t() inline); aquí van co-ubicados por ser una POC autocontenida.
 */
import { i18n } from "vanui";

const ES = {
  site: {
    title: "Tienda VanUI",
    catalogTitle: "Catálogo",
    catalogDesc: "Catálogo de productos de la tienda VanUI, generado estáticamente.",
    loading: "Cargando…",
    viewProduct: "Ver detalle →",
    inStock: "En stock",
    outStock: "Agotado",
    addToCart: "Agregar al carrito",
    quantity: "Cantidad",
    increase: "Aumentar cantidad",
    decrease: "Disminuir cantidad",
    notFoundTitle: "Producto no encontrado",
    notFoundBack: "← Catálogo",
    footer: "POC SSG — vanui intacta.",
  },
};

const EN = {
  site: {
    title: "VanUI Store",
    catalogTitle: "Catalog",
    catalogDesc: "Product catalog of the VanUI store — statically generated for SEO.",
    loading: "Loading…",
    viewProduct: "View product →",
    inStock: "In stock",
    outStock: "Out of stock",
    addToCart: "Add to cart",
    quantity: "Quantity",
    increase: "Increase quantity",
    decrease: "Decrease quantity",
    notFoundTitle: "Product not found",
    notFoundBack: "← Catalog",
    footer: "SSG proof of concept — vanui untouched.",
  },
};

export const registerSiteTranslations = () => {
  i18n.addTranslations({ es: ES, en: EN });
};
