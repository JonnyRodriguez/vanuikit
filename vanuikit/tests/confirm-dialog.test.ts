import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { ConfirmDialog, confirmDialog } from "../src/components/confirm-dialog.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("ConfirmDialog", () => {
  test("renders the dialog closed and shows it on open", async () => {
    let confirmed = false;
    const dialog = ConfirmDialog({
      title: "Delete item",
      message: "Are you sure?",
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
    expect(dom.textContent).toContain("Delete item");
    expect(dom.textContent).toContain("Are you sure?");

    const buttons = Array.from(dom.querySelectorAll("button"));
    // Find the confirm button
    const confirmBtn = buttons.find((b) => b.textContent?.includes("Confirm")) as HTMLButtonElement;
    expect(confirmBtn).toBeDefined();
    confirmBtn.click();
    await tick();

    expect(confirmed).toBe(true);
    expect(dialog.isVisible.val).toBe(false);
  });

  test("imperative confirmDialog returns true on confirm", async () => {
    const promise = confirmDialog({
      title: "Continue?",
      message: "Please confirm",
      confirmText: "Yes, continue",
    });

    await tick();
    const overlay = document.body.lastElementChild as HTMLElement;
    expect(overlay.textContent).toContain("Continue?");

    const buttons = Array.from(overlay.querySelectorAll("button"));
    const confirmBtn = buttons.find((b) => b.textContent?.includes("Yes, continue")) as HTMLButtonElement;
    expect(confirmBtn).toBeDefined();
    confirmBtn.click();

    const result = await promise;
    expect(result).toBe(true);
  });
});
