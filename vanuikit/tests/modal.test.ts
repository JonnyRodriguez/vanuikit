import { describe, test, expect } from "bun:test";
import { Modal, ModalBase } from "../src/components/modal.js";

// VanJS actualiza los bindings en un microtask; hay que esperarlo.
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("ModalBase", () => {
  test("oculto por defecto; open/close alternan la clase", async () => {
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

  test("set() rellena zonas y muestra con show=true", async () => {
    const modal = ModalBase();
    modal.mount(document.body);
    modal.set({ header: "Hola", body: "Mundo" }, true);
    await tick();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.textContent).toContain("Hola");
    expect(overlay.textContent).toContain("Mundo");
    expect(overlay.className).toContain("bg-overlay");
  });

  test("zona footer: null la oculta", async () => {
    const modal = ModalBase();
    modal.mount(document.body);
    modal.set({ footer: null, body: "solo cuerpo" }, true);
    await tick();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.textContent).not.toContain("Close");
  });
});

describe("Modal", () => {
  test("trae título, botón de cierre y footer con Cerrar", async () => {
    const modal = Modal();
    modal.mount(document.body);
    modal.set({ title: "Editar", body: "contenido" }, true);
    await tick();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.textContent).toContain("Editar");
    expect(overlay.textContent).toContain("contenido");
    expect(overlay.textContent).toContain("Close");

    const closeBtn = overlay.querySelector('[aria-label="Close"]') as HTMLElement;
    closeBtn.click();
    expect(modal.isVisible.val).toBe(false);
  });
});
