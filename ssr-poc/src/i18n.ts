// ssr-poc/src/i18n.ts
/**
 * i18n mínimo y autocontenido de la POC (desacoplado de demo/ y de vanui).
 * Sirve para fijar el idioma en el servidor y para que la hidratación
 * resuelva los mismos textos.
 */
export const LOCALES = ["es", "en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

export const isLocale = (v: string): v is Locale =>
  (LOCALES as readonly string[]).includes(v);

type Messages = Record<string, string>;

const catalog: Record<Locale, Messages> = {
  es: {
    title: "Tienda VanUI (SSR)",
    catalogTitle: "Catálogo",
    addToCart: "Agregar al carrito",
    quantity: "Cantidad",
    increase: "Aumentar cantidad",
    decrease: "Disminuir cantidad",
    notFoundTitle: "Producto no encontrado",
    notFoundBack: "← Catálogo",
  },
  en: {
    title: "VanUI Store (SSR)",
    catalogTitle: "Catalog",
    addToCart: "Add to cart",
    quantity: "Quantity",
    increase: "Increase quantity",
    decrease: "Decrease quantity",
    notFoundTitle: "Product not found",
    notFoundBack: "← Catalog",
  },
  fr: {
    title: "Boutique VanUI (SSR)",
    catalogTitle: "Catalogue",
    addToCart: "Ajouter au panier",
    quantity: "Quantité",
    increase: "Augmenter la quantité",
    decrease: "Diminuer la quantité",
    notFoundTitle: "Produit introuvable",
    notFoundBack: "← Catalogue",
  },
};

export const t = (l: Locale, key: string): string =>
  catalog[l]?.[key] ?? catalog.es[key] ?? key;
