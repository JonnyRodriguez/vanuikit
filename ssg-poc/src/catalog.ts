// ssg-poc/src/catalog.ts
/**
 * Catálogo de productos (mock). Slugs CANÓNICOS (no se traducen); nombre y
 * descripción tienen variantes por idioma.
 *
 * La "API" sirve este arreglo tal cual (scripts/api-mock.ts en build,
 * scripts/preview.mjs en runtime); la localización la hace la página con
 * `localize()`. Así build y runtime recorren el mismo camino de código.
 */
export interface Product {
  slug: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  image: string;
  stock: number;
  nameByLocale?: Record<string, string>;
  descriptionByLocale?: Record<string, string>;
}

export const PRODUCTS: Product[] = [
  {
    slug: "teclado-mecanico",
    name: "Teclado Mecánico RGB",
    price: 89.99,
    currency: "USD",
    description: "Switch rojo, retroiluminación RGB y teclas PBT de doble inyección.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' rx='12' fill='%23312e81'/%3E%3Crect x='14' y='28' width='68' height='40' rx='6' fill='%23c7d2fe'/%3E%3C/svg%3E",
    stock: 14,
    nameByLocale: { en: "RGB Mechanical Keyboard" },
    descriptionByLocale: {
      en: "Red switches, RGB backlight and double-shot PBT keycaps.",
    },
  },
  {
    slug: "mouse-gamer",
    name: "Mouse Gamer 16000 DPI",
    price: 39.5,
    currency: "USD",
    description: "Sensor óptico de alta precisión, 7 botones programables y cable paracord.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' rx='12' fill='%23713f12'/%3E%3Cellipse cx='48' cy='52' rx='22' ry='30' fill='%23fde68a'/%3E%3C/svg%3E",
    stock: 3,
    nameByLocale: { en: "Gaming Mouse 16000 DPI" },
    descriptionByLocale: {
      en: "High-precision optical sensor, 7 programmable buttons and paracord cable.",
    },
  },
  {
    slug: "monitor-27",
    name: 'Monitor 27" IPS',
    price: 259.0,
    currency: "USD",
    description: "Panel IPS 144Hz, 1ms y cobertura del 99% sRGB, ideal para diseño y gaming.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' rx='12' fill='%23134e4a'/%3E%3Crect x='16' y='24' width='64' height='40' rx='4' fill='%2399f6e4'/%3E%3C/svg%3E",
    stock: 0,
    nameByLocale: { en: '27" IPS Monitor' },
    descriptionByLocale: {
      en: "IPS panel, 144Hz, 1ms and 99% sRGB coverage, ideal for design and gaming.",
    },
  },
];

export const findProduct = (slug: string): Product | undefined =>
  PRODUCTS.find((p) => p.slug === slug);

/** Nombre/descripción ya localizados (el slug queda canónico). */
export const localize = (p: Product, locale: string) => ({
  name: p.nameByLocale?.[locale] ?? p.name,
  description: p.descriptionByLocale?.[locale] ?? p.description,
});
