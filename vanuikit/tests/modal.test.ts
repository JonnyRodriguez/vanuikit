import { describe, test, expect } from "bun:test";
import { Modal, ModalBase } from "../src/components/modal.js";

// VanJS updates bindings in a microtask; tests must wait for it.
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("ModalBase", () => {
  test("hidden by default; open/close toggle the class", async () => {
    const modal = ModalBase();
    modal.mount(document.body);
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.className).toContain("hidden");

    modal.open();
    await tick();
    expect(overlay.className).toContain("bg-overlay");
    modal.close();
    await tick();
    expect(overlay.className).toContain("hidden");
  });

  test("set() fills the zones and shows with show=true", async () => {
    const modal = ModalBase();
    modal.mount(document.body);
    modal.set({ header: "Hello", body: "World" }, true);
    await tick();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.textContent).toContain("Hello");
    expect(overlay.textContent).toContain("World");
    expect(overlay.className).toContain("bg-overlay");
  });

  test("footer zone: null hides it", async () => {
    const modal = ModalBase();
    modal.mount(document.body);
    modal.set({ footer: null, body: "body only" }, true);
    await tick();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.textContent).not.toContain("Close");
  });
});

describe("Modal", () => {
  test("brings title, close button and a footer with Close", async () => {
    const modal = Modal();
    modal.mount(document.body);
    modal.set({ title: "Edit", body: "content" }, true);
    await tick();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.textContent).toContain("Edit");
    expect(overlay.textContent).toContain("content");
    expect(overlay.textContent).toContain("Close");

    const closeBtn = overlay.querySelector('[aria-label="Close"]') as HTMLElement;
    closeBtn.click();
    expect(modal.isVisible.val).toBe(false);
  });
});
