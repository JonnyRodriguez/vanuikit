import { describe, test, expect } from "bun:test";
import { van, Tree } from "../src/index.js";

const { div, button, span } = van.tags;

// van 1.6 defers DOM updates to a microtask (updateDoms): interactions must
// wait a tick before asserting the DOM.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const mount = (props: Record<string, unknown> = {}) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  van.add(host, Tree(props as any));
  return host;
};

const sample = () => [
  {
    id: 1,
    label: "Categoría principal",
    children: [{ id: 2, label: "Hijo" }],
  },
  { id: 3, label: "Otra" },
];

describe("Tree", () => {
  test("renders all root nodes with their labels", () => {
    const host = mount({ nodes: sample() });
    expect(host.querySelector('[role="tree"]')).not.toBeNull();
    expect(host.textContent).toContain("Categoría principal");
    expect(host.textContent).toContain("Otra");
  });

  test("expanded by default: children visible until manually collapsed", async () => {
    const host = mount({ nodes: sample() });
    const parentRow = host.querySelector('[role="treeitem"][aria-expanded]') as HTMLElement;
    expect(parentRow.getAttribute("aria-expanded")).toBe("true");
    const childRow = host.querySelector('[role="treeitem"][aria-level="2"]') as HTMLElement;
    expect(childRow.closest('[role="group"]')?.className).not.toContain("hidden");

    // A manual collapse persists (does not reopen on reload).
    const chevron = parentRow.querySelector('button[aria-hidden="true"]') as HTMLButtonElement;
    chevron.click();
    await tick();
    expect(parentRow.getAttribute("aria-expanded")).toBe("false");
    expect(childRow.closest('[role="group"]')?.className).toContain("hidden");
  });

  test("chevron toggles expand/collapse", async () => {
    const host = mount({ nodes: sample() });
    const parentRow = host.querySelector('[role="treeitem"][aria-expanded]') as HTMLElement;
    const chevron = parentRow.querySelector('button[aria-hidden="true"]') as HTMLButtonElement;
    expect(parentRow.getAttribute("aria-expanded")).toBe("true");
    chevron.click();
    await tick();
    expect(parentRow.getAttribute("aria-expanded")).toBe("false");
    chevron.click();
    await tick();
    expect(parentRow.getAttribute("aria-expanded")).toBe("true");
  });

  test("expandAll=false starts collapsed; defaultExpanded seeds open node", async () => {
    const host = mount({ nodes: sample(), expandAll: false, defaultExpanded: [1] });
    const parentRow = host.querySelector('[role="treeitem"][aria-expanded]') as HTMLElement;
    expect(parentRow.getAttribute("aria-expanded")).toBe("true");
    const childRow = host.querySelector('[role="treeitem"][aria-level="2"]') as HTMLElement;
    expect(childRow.closest('[role="group"]')?.className).not.toContain("hidden");

    const host2 = mount({ nodes: sample(), expandAll: false });
    const child2 = host2.querySelector('[role="treeitem"][aria-level="2"]') as HTMLElement;
    expect(child2.closest('[role="group"]')?.className).toContain("hidden");
  });

  test("actions slot renders per node and receives the node", async () => {
    let editedId: string | number | null = null;
    const host = mount({
      nodes: sample().map((n) => ({
        ...n,
        actions: (node: { id: string | number }) =>
          button({ class: "row-act", onclick: () => {
            editedId = node.id;
          } }, "Editar"),
      })),
    });
    const edits = host.querySelectorAll(".row-act");
    expect(edits.length).toBe(2);
    expect(host.textContent).toContain("Editar");
    (edits[0] as HTMLButtonElement).click();
    await tick();
    expect(editedId).toBe(1);
  });

  test("inline add-child: opens form, submits by Enter and calls onAddChild", async () => {
    let added: { id: string | number; name: string } | null = null;
    const host = mount({
      nodes: sample(),
      onAddChild: (node: { id: string | number }, name: string) => {
        added = { id: node.id, name };
      },
    });

    const addBtn = host.querySelector('button[aria-label="Add child"]') as HTMLButtonElement;
    expect(addBtn).not.toBeNull();
    addBtn.click();
    await tick();

    const inputEl = host.querySelector('input[type="text"]') as HTMLInputElement;
    expect(inputEl).not.toBeNull();
    inputEl.value = "Sub 1";
    inputEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await tick();

    expect(added).toEqual({ id: 1, name: "Sub 1" });
    // form closed after submit
    expect(host.querySelector('input[type="text"]')).toBeNull();
  });

  test("inline add-child: confirm button submits and Escape cancels", async () => {
    let added: any = null;
    const host = mount({
      nodes: sample(),
      onAddChild: (node: any, name: string) => {
        added = { id: node.id, name };
      },
    });

    // Confirm button path
    (host.querySelector('button[aria-label="Add child"]') as HTMLButtonElement).click();
    await tick();
    const inputEl = host.querySelector('input[type="text"]') as HTMLInputElement;
    inputEl.value = "Hijo B";
    const confirmBtn = Array.from(host.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Confirm") as HTMLButtonElement;
    confirmBtn.click();
    await tick();
    expect(added).toEqual({ id: 1, name: "Hijo B" });
    expect(host.querySelector('input[type="text"]')).toBeNull();

    // Escape cancels without calling the callback
    (host.querySelector('button[aria-label="Add child"]') as HTMLButtonElement).click();
    await tick();
    const input2 = host.querySelector('input[type="text"]') as HTMLInputElement;
    input2.value = "No debe llegar";
    input2.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await tick();
    expect(host.querySelector('input[type="text"]')).toBeNull();
    expect(added).toEqual({ id: 1, name: "Hijo B" }); // unchanged
  });

  test("empty nodes render an empty hint", () => {
    const host = mount({ nodes: [] });
    expect(host.textContent).toContain("No items");

    const host2 = mount({ nodes: [], emptyText: false });
    expect(host2.textContent.trim()).toBe("");
  });

  test("reactive nodes: rebuilds when the State changes", async () => {
    const nodes = van.state<any[]>(sample());
    const host = mount({ nodes });
    expect(host.textContent).toContain("Categoría principal");

    nodes.val = [{ id: 9, label: "Nueva raíz" }];
    await tick();
    expect(host.textContent).toContain("Nueva raíz");
    expect(host.textContent).not.toContain("Categoría principal");
    expect(host.textContent).not.toContain("Otra");
  });
});
