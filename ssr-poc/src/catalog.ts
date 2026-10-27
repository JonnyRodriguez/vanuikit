// ssr-poc/src/catalog.ts
/**
 * Catálogo de productos (mock). Los slugs son CANÓNICOS (no se traducen);
 * el nombre/descripción pueden tener variantes por idioma.
 */
import type { Product } from "./product-card.js";

export const PRODUCTS: Product[] = [
  {
    slug: "teclado-mecanico",
    name: "Teclado Mecánico RGB",
    price: 89.99,
    currency: "USD",
    description: "Switch rojo, retroiluminación RGB y teclas PBT de doble inyección.",
    image: "/assets/img/teclado.svg",
    nameByLocale: { en: "RGB Mechanical Keyboard", fr: "Clavier mécanique RGB" },
    descriptionByLocale: {
      en: "Red switches, RGB backlight and double-shot PBT keycaps.",
      fr: "Switches rouges, rétroéclairage RGB et touches PBT à double injection.",
    },
  },
  {
    slug: "mouse-gamer",
    name: "Mouse Gamer 16000 DPI",
    price: 39.5,
    currency: "USD",
    description: "Sensor óptico de alta precisión, 7 botones programables y cable paracord.",
    image: "/assets/img/mouse.svg",
    nameByLocale: { en: "Gaming Mouse 16000 DPI", fr: "Souris gaming 16000 DPI" },
    descriptionByLocale: {
      en: "High-precision optical sensor, 7 programmable buttons and paracord cable.",
      fr: "Capteur optique haute précision, 7 boutons programmables et câble paracord.",
    },
  },
  {
    slug: "monitor-27",
    name: 'Monitor 27" IPS',
    price: 259.0,
    currency: "USD",
    description: "Panel IPS 144Hz, 1ms y cobertura del 99% sRGB, ideal para diseño y gaming.",
    image: "/assets/img/monitor.svg",
    nameByLocale: { en: '27" IPS Monitor', fr: 'Moniteur 27" IPS' },
    descriptionByLocale: {
      en: "IPS panel, 144Hz, 1ms and 99% sRGB coverage, ideal for design and gaming.",
      fr: "Panneau IPS, 144Hz, 1ms et couverture de 99% sRGB, idéal pour le design et le gaming.",
    },
  },
];
