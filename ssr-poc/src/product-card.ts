// ssr-poc/src/product-card.ts
/**
 * ProductCard — componente compartido para SSR + hidratación.
 *
 * Corre en DOS entornos con la MISMA definición:
 *   · Servidor (van-plate): se renderiza a string HTML -> SEO.
 *   · Cliente (vanjs-core): se hidrata con van.hydrate -> reactividad.
 *
 * El estado (cantidad) se serializa en `data-qty` durante el SSR; la
 * hidratación lo relee para reconstruir el componente con el mismo estado.
 *
 * i18n: el componente es agnóstico del idioma. Quien lo invoca resuelve el
 * locale y pasa los textos ya traducidos vía `texts` y el nombre/descripción
 * ya localizados como props. El slug es canónico.
 */
import { env, type State } from "mini-van-plate/shared";

export interface Product {
  slug: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  image: string;
  nameByLocale?: Record<string, string>;
  descriptionByLocale?: Record<string, string>;
}

export interface ProductTexts {
  addToCart: string;
  quantityLabel: string;
  increaseLabel: string;
  decreaseLabel: string;
}

export interface ProductCardProps extends Product {
  /** Cantidad inicial (se serializa en data-qty para hidratación). */
  qty?: number;
  /** Textos ya traducidos al locale activo. */
  texts?: Partial<ProductTexts>;
}

const DEFAULT_TEXTS: ProductTexts = {
  addToCart: "Agregar al carrito",
  quantityLabel: "Cantidad",
  increaseLabel: "Aumentar cantidad",
  decreaseLabel: "Disminuir cantidad",
};

export const ProductCard = (props: ProductCardProps) => {
  const { article, div, h3, p, img, button, span, strong } = env.van.tags as any;
  const qty = env.van.state(props.qty ?? 1);
  const texts: ProductTexts = { ...DEFAULT_TEXTS, ...props.texts };

  return article(
    {
      id: `product-${props.slug}`,
      class: "product-card",
      "data-hydrate": "",
      "data-name": props.name,
      "data-price": String(props.price),
      "data-currency": props.currency,
      "data-description": props.description,
      "data-image": props.image,
      "data-qty": qty,
    },
    img({ src: props.image, alt: props.name }),
    div(
      { class: "product-body" },
      h3(props.name),
      p({ class: "product-desc" }, props.description),
      p(
        { class: "product-price" },
        strong(`${props.price.toFixed(2)} ${props.currency}`),
      ),
      div(
        { class: "qty-controls", "aria-label": texts.quantityLabel },
        button(
          {
            type: "button",
            class: "qty-btn",
            "aria-label": texts.decreaseLabel,
            onclick: () => {
              qty.val = Math.max(1, qty.val - 1);
            },
          },
          "-",
        ),
        span({ class: "qty-value" }, () => qty.val),
        button(
          {
            type: "button",
            class: "qty-btn",
            "aria-label": texts.increaseLabel,
            onclick: () => {
              qty.val += 1;
            },
          },
          "+",
        ),
      ),
      button({ type: "button", class: "add-btn" }, texts.addToCart),
    ),
  );
};
