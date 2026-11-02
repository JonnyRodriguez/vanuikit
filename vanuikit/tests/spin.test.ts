import { describe, test, expect } from "bun:test";
import { Spin } from "../src/components/spin.js";
import { SpinModal } from "../src/components/spin-modal.js";

describe("Spin", () => {
  test("shows the message and the spinning ring", () => {
    const node = Spin("Cargando...");
    expect(node.textContent).toContain("Cargando...");
    expect(node.querySelector(".animate-spin")).not.toBeNull();
  });
});

describe("SpinModal", () => {
  test("null footer so no Close button is shown", () => {
    const content = SpinModal("Procesando");
    expect(content.footer).toBeNull();
    expect(content.body).not.toBeNull();
  });
});
