import { describe, test, expect } from "bun:test";
import vanPlate from "mini-van-plate/van-plate";
import vanClient from "vanjs-core";
import { registerEnv } from "mini-van-plate/shared";
import { ProductCard } from "../src/product-card.js";
import { PRODUCTS } from "../src/catalog.js";
import { hydrateProducts } from "../src/hydrate.js";

const flush = () => new Promise((r) => setTimeout(r, 25));

describe("SSR + hidratación (ProductCard)", () => {
  test("el SSR sirve el contenido completo y la hidratación reactiva los controles", async () => {
    const product = PRODUCTS[0];

    // ---- SSR: el runtime de render es van-plate (como en el servidor) ----
    registerEnv({ van: vanPlate });
    const html = ProductCard(product).render();
    expect(html).toContain("Teclado Mecánico RGB"); // título (SEO)
    expect(html).toContain("89.99 USD"); // precio
    expect(html).toContain("Switch rojo"); // descripción
    expect(html).toContain(`data-qty="1"`); // estado serializado

    // ---- Montar ese HTML en un DOM (como si llegara del servidor) ----
    document.body.innerHTML = html;
    expect(document.querySelector(".product-card")).toBeTruthy();

    // ---- Hidratación: ahora usa el van del cliente (vanjs-core) ----
    registerEnv({ van: vanClient });
    hydrateProducts();
    await flush();

    const qtyEl = document.querySelector(".qty-value") as HTMLElement | null;
    expect(qtyEl?.textContent).toBe("1");

    // El botón "+" ahora debe ser reactivo y cambiar la cantidad.
    const plus = [...document.querySelectorAll(".qty-btn")].find(
      (b) => b.textContent?.trim() === "+",
    );
    expect(plus).toBeTruthy();
    (plus as HTMLElement).click();
    await flush();
    expect(document.querySelector(".qty-value")?.textContent).toBe("2");
  });
});
