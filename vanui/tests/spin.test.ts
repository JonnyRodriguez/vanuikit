import { describe, test, expect } from "bun:test";
import { Spin } from "../src/components/spin.js";
import { SpinModal } from "../src/components/spin-modal.js";

describe("Spin", () => {
  test("muestra el mensaje y el anillo girando", () => {
    const node = Spin("Cargando...");
    expect(node.textContent).toContain("Cargando...");
    expect(node.querySelector(".animate-spin")).not.toBeNull();
  });
});

describe("SpinModal", () => {
  test("footer null para no mostrar el botón Cerrar", () => {
    const content = SpinModal("Procesando");
    expect(content.footer).toBeNull();
    expect(content.body).not.toBeNull();
  });
});
