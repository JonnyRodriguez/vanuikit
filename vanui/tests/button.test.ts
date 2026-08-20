import { describe, test, expect } from "bun:test";
import { Button, PrimaryButton, SecondaryButton } from "../src/components/button.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

describe("Button", () => {
  test("defaults: variant primary, size md, type button", () => {
    const btn = mount(Button({}, "Hola"));
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.type).toBe("button");
    expect(btn.className).toContain("bg-primary");
    expect(btn.className).toContain("text-primary-fg");
    expect(btn.className).toContain("px-4");
    expect(btn.className).toContain("py-2");
    expect(btn.textContent).toBe("Hola");
  });

  test("variant secondary aplica las clases secundarias", () => {
    const btn = mount(Button({ variant: "secondary" }, "X"));
    expect(btn.className).toContain("bg-secondary");
    expect(btn.className).not.toContain("bg-primary");
  });

  test("size sm y lg cambian padding/texto", () => {
    const sm = mount(Button({ size: "sm" }));
    expect(sm.className).toContain("text-sm");
    expect(sm.className).toContain("px-3");
    const lg = mount(Button({ size: "lg" }));
    expect(lg.className).toContain("text-lg");
    expect(lg.className).toContain("px-6");
  });

  test("type submit se propaga al DOM", () => {
    const btn = mount(Button({ type: "submit" }));
    expect(btn.type).toBe("submit");
  });

  test("class extra se fusiona al final", () => {
    const btn = mount(Button({ class: "mi-clase" }));
    expect(btn.className).toContain("mi-clase");
  });

  test("wrappers de compatibilidad delegan en Button", () => {
    const p = mount(PrimaryButton({}, "P"));
    expect(p.className).toContain("bg-primary");
    const s = mount(SecondaryButton({}, "S"));
    expect(s.className).toContain("bg-secondary");
  });
});
