// ssr-poc/src/hydrate.ts
/**
 * Cliente de hidratación (CSR).
 *
 * Registra el `van` real de vanjs-core y hidrata cada `[data-hydrate]` con
 * `van.hydrate`, recuperando el estado serializado por el SSR.
 *
 * i18n: el locale que el SSR fijó se serializa en `<html lang>` y
 * `data-locale`; se retoma aquí antes de hidratar, para que los textos del
 * cliente coincidan con los del servidor (sin "brincos" de idioma).
 */
import van from "vanjs-core";
import { registerEnv } from "mini-van-plate/shared";
import { ProductCard, type ProductCardProps } from "./product-card.js";
import { isLocale, DEFAULT_LOCALE, t, type Locale } from "./i18n.js";

registerEnv({ van });

const resolveLocale = (): Locale => {
  const lang = document.querySelector("html")?.getAttribute("lang");
  const bodyLocale = document.body.dataset.locale;
  const v = (lang ?? bodyLocale ?? DEFAULT_LOCALE) as string;
  return isLocale(v) ? v : DEFAULT_LOCALE;
};

const textsOf = (l: Locale) => ({
  addToCart: t(l, "addToCart"),
  quantityLabel: t(l, "quantity"),
  increaseLabel: t(l, "increase"),
  decreaseLabel: t(l, "decrease"),
});

/** Hidrata todas las tarjetas de producto marcadas con [data-hydrate]. */
export const hydrateProducts = () => {
  const locale = resolveLocale();
  const texts = textsOf(locale);

  document.querySelectorAll<HTMLElement>("[data-hydrate]").forEach((dom) => {
    van.hydrate(dom, () =>
      ProductCard({
        slug: dom.getAttribute("id")?.replace(/^product-/, "") ?? "",
        name: dom.getAttribute("data-name") ?? "",
        price: Number(dom.getAttribute("data-price")) || 0,
        currency: dom.getAttribute("data-currency") ?? "USD",
        description: dom.getAttribute("data-description") ?? "",
        image: dom.getAttribute("data-image") ?? "",
        qty: Math.max(1, Number(dom.getAttribute("data-qty")) || 1),
        texts,
      } as ProductCardProps),
    );
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrateProducts);
} else {
  hydrateProducts();
}
