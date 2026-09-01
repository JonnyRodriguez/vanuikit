import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { ConfirmDialog, confirmDialog } from "../src/components/confirm-dialog.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("ConfirmDialog", () => {
  test("renderiza el diálogo cerrado y se muestra al abrir", async () => {
    let confirmed = false;
    const dialog = ConfirmDialog({
      title: "Eliminar elemento",
      message: "¿Estás seguro?",
      variant: "danger",
      onConfirm: () => {
        confirmed = true;
      },
    });

    const dom = dialog.dom();
    document.body.appendChild(dom);
    await tick();

    expect(dom.className).toContain("hidden");

    dialog.open();
    await tick();

    expect(dom.className).not.toContain("hidden");
    expect(dom.textContent).toContain("Eliminar elemento");
    expect(dom.textContent).toContain("¿Estás seguro?");

    const buttons = Array.from(dom.querySelectorAll("button"));
    // Buscamos el botón de confirmar
    const confirmBtn = buttons.find((b) => b.textContent?.includes("Confirmar")) as HTMLButtonElement;
    expect(confirmBtn).toBeDefined();
    confirmBtn.click();
    await tick();

    expect(confirmed).toBe(true);
    expect(dialog.isVisible.val).toBe(false);
  });

  test("confirmDialog imperativo retorna true al confirmar", async () => {
    const promise = confirmDialog({
      title: "¿Continuar?",
      message: "Por favor confirme",
      confirmText: "Sí, continuar",
    });

    await tick();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.textContent).toContain("¿Continuar?");

    const buttons = Array.from(overlay.querySelectorAll("button"));
    const confirmBtn = buttons.find((b) => b.textContent?.includes("Sí, continuar")) as HTMLButtonElement;
    expect(confirmBtn).toBeDefined();
    confirmBtn.click();

    const result = await promise;
    expect(result).toBe(true);
  });
});
