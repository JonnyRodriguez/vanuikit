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

  test("variant secondary applies the secondary classes", () => {
    const btn = mount(Button({ variant: "secondary" }, "X"));
    expect(btn.className).toContain("bg-secondary");
    expect(btn.className).not.toContain("bg-primary");
  });

  test("size sm and lg change padding/text", () => {
    const sm = mount(Button({ size: "sm" }));
    expect(sm.className).toContain("text-sm");
    expect(sm.className).toContain("px-3");
    const lg = mount(Button({ size: "lg" }));
    expect(lg.className).toContain("text-lg");
    expect(lg.className).toContain("px-6");
  });

  test("type submit propagates to the DOM", () => {
    const btn = mount(Button({ type: "submit" }));
    expect(btn.type).toBe("submit");
  });

  test("extra class merges at the end", () => {
    const btn = mount(Button({ class: "my-class" }));
    expect(btn.className).toContain("my-class");
  });

  test("compatibility wrappers delegate to Button", () => {
    const p = mount(PrimaryButton({}, "P"));
    expect(p.className).toContain("bg-primary");
    const s = mount(SecondaryButton({}, "S"));
    expect(s.className).toContain("bg-secondary");
  });

  test("auto width by default (without w-full)", () => {
    const btn = mount(Button({}, "X"));
    expect(btn.className).not.toContain("w-full");
  });

  test("block: true enables w-full (opt-in)", () => {
    const btn = mount(Button({ block: true }, "X"));
    expect(btn.className).toContain("w-full");
  });
});
