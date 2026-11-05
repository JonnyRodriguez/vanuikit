import { describe, test, expect, afterEach } from "bun:test";
import van from "vanjs-core";
import { Tooltip } from "../src/components/tooltip.js";
import { Popover } from "../src/components/popover.js";
import { Drawer } from "../src/components/drawer.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS updates bindings in a microtask; tests must wait for it.
const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  document.body.style.overflow = "";
});

describe("Tooltip", () => {
  test("hidden by default; focusin shows it instantly and focusout hides it", async () => {
    const el = mount(
      Tooltip({ content: "Mensaje de ayuda" }, van.tags.button("Disparador")) as HTMLElement,
    );
    const bubble = el.querySelector('[role="tooltip"]') as HTMLElement;
    expect(bubble.className).toContain("hidden");

    el.dispatchEvent(new FocusEvent("focusin"));
    await tick();
    expect(bubble.textContent).toBe("Mensaje de ayuda");
    expect(bubble.className).not.toContain("hidden");
    expect(bubble.className).toContain("z-50");

    el.dispatchEvent(new FocusEvent("focusout"));
    await tick();
    expect(bubble.className).toContain("hidden");
  });

  test("mouseenter shows (delay 0) and mouseleave hides", async () => {
    const el = mount(
      Tooltip({ content: "Hola", delay: 0, position: "left" }, van.tags.button("X")) as HTMLElement,
    );
    el.dispatchEvent(new MouseEvent("mouseenter"));
    await tick();
    const bubble = el.querySelector('[role="tooltip"]') as HTMLElement;
    expect(bubble.textContent).toBe("Hola");
    expect(bubble.className).toContain("-translate-y-1/2"); // left position
    expect(bubble.className).toContain("mr-2");
    expect(bubble.className).not.toContain("hidden");

    el.dispatchEvent(new MouseEvent("mouseleave"));
    await tick();
    expect(bubble.className).toContain("hidden");
  });

  test("disabled blocks hover and focus", async () => {
    const el = mount(
      Tooltip({ content: "Nada", delay: 0, disabled: true }, van.tags.button("X")) as HTMLElement,
    );
    el.dispatchEvent(new MouseEvent("mouseenter"));
    el.dispatchEvent(new FocusEvent("focusin"));
    await tick();
    expect(
      (el.querySelector('[role="tooltip"]') as HTMLElement).className,
    ).toContain("hidden");
  });

  test("reactive content (State) reaches the bubble", async () => {
    const msg = van.state("Uno");
    const el = mount(
      Tooltip({ content: msg, delay: 0 }, van.tags.button("X")) as HTMLElement,
    );
    el.dispatchEvent(new FocusEvent("focusin"));
    await tick();
    expect((el.querySelector('[role="tooltip"]') as HTMLElement).textContent).toBe("Uno");

    msg.val = "Dos";
    await tick();
    expect((el.querySelector('[role="tooltip"]') as HTMLElement).textContent).toBe("Dos");
  });
});

describe("Popover", () => {
  const build = () =>
    Popover({
      trigger: van.tags.button({ id: "pop-trigger" }, "Opciones"),
      ariaLabel: "Acciones",
      content: (close) =>
        van.tags.div(
          van.tags.button({ id: "pop-action" }, "Acción"),
          van.tags.button({ id: "pop-close", onclick: close }, "Cerrar"),
        ),
    });

  test("click toggles the panel with aria-expanded and role=dialog", async () => {
    const el = mount(build() as HTMLElement);
    const panel = () => el.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel().className).toContain("hidden");
    expect(el.querySelector('[aria-haspopup="dialog"]')!.getAttribute("aria-expanded")).toBe("false");

    (el.querySelector("#pop-trigger") as HTMLButtonElement).click();
    await tick();
    expect(panel().className).not.toContain("hidden");
    expect(el.querySelector('[aria-haspopup="dialog"]')!.getAttribute("aria-expanded")).toBe("true");

    (el.querySelector("#pop-trigger") as HTMLButtonElement).click();
    await tick();
    expect(panel().className).toContain("hidden");
  });

  test("Escape closes and returns focus to the trigger", async () => {
    const el = mount(build() as HTMLElement);
    const trigger = el.querySelector("#pop-trigger") as HTMLButtonElement;
    trigger.click();
    await tick();
    expect((el.querySelector('[role="dialog"]') as HTMLElement).className).not.toContain("hidden");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await tick();
    expect((el.querySelector('[role="dialog"]') as HTMLElement).className).toContain("hidden");
    expect(document.activeElement).toBe(trigger);
  });

  test("click outside closes; click inside (including the trigger) does not", async () => {
    const el = mount(build() as HTMLElement);
    (el.querySelector("#pop-trigger") as HTMLButtonElement).click();
    await tick();
    const panel = el.querySelector('[role="dialog"]') as HTMLElement;

    // Click inside the panel (bubbles up to document): the document handler
    // sees it as "inside the container" and does not close.
    panel.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await tick();
    expect(panel.className).not.toContain("hidden");

    // Click outside (target = body): closes.
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await tick();
    expect(panel.className).toContain("hidden");
  });

  test("panel close() works and cleans up listeners", async () => {
    const el = mount(build() as HTMLElement);
    (el.querySelector("#pop-trigger") as HTMLButtonElement).click();
    await tick();
    (el.querySelector("#pop-close") as HTMLButtonElement).click();
    await tick();
    expect((el.querySelector('[role="dialog"]') as HTMLElement).className).toContain("hidden");

    // No residual listeners: a document click no longer breaks anything
    document.dispatchEvent(new MouseEvent("click"));
    expect((el.querySelector('[role="dialog"]') as HTMLElement).className).toContain("hidden");
  });
});

describe("Drawer", () => {
  const build = (side: "left" | "right" | "top" | "bottom" = "right") => {
    const open = van.state(false);
    let closes = 0;
    const dom = Drawer(
      {
        open,
        side,
        onClose: () => closes++,
      },
      van.tags.div(
        van.tags.h2("Título del panel"),
        van.tags.p("Contenido del drawer."),
        van.tags.button({ id: "drawer-first" }, "Primera acción"),
      ),
    );
    return { open, dom: dom as HTMLElement, getCloses: () => closes };
  };

  test("the State controls visibility with side classes and aria-hidden", async () => {
    const { open, dom } = build("right");
    mount(dom);
    const panel = dom.querySelector('[role="dialog"]') as HTMLElement;

    expect(panel.className).toContain("translate-x-full");
    expect(dom.getAttribute("aria-hidden")).toBe("true");

    open.val = true;
    await tick();
    expect(panel.className).toContain("translate-x-0");
    expect(dom.getAttribute("aria-hidden")).toBe("false");
    expect(document.body.style.overflow).toBe("hidden"); // scroll locked

    open.val = false;
    await tick();
    expect(panel.className).toContain("translate-x-full");
    expect(document.body.style.overflow).toBe(""); // scroll released
  });

  test("Escape closes (dismissible), notifies onClose and returns focus", async () => {
    const { open, dom, getCloses } = build("left");
    mount(dom);
    // The opener must exist AFTER the mount (replaceChildren would wipe it).
    const opener = van.tags.button("Abrir");
    document.body.append(opener);
    opener.focus();

    open.val = true;
    await tick();
    // Focus entered the panel
    expect(document.activeElement?.closest('[role="dialog"]')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await tick();
    expect(open.val).toBe(false);
    expect(getCloses()).toBe(1);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  test("backdrop click closes; panel click does not", async () => {
    const { open, dom } = build();
    mount(dom);
    open.val = true;
    await tick();

    const backdrop = dom.firstElementChild as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent("click", { bubbles: false }));
    await tick();
    expect(open.val).toBe(false);

    open.val = true;
    await tick();
    const panel = dom.querySelector('[role="dialog"]') as HTMLElement;
    panel.dispatchEvent(new MouseEvent("click", { bubbles: false }));
    await tick();
    expect(open.val).toBe(true);
  });

  test("dismissible: false disables Esc and backdrop; showClose: false removes the button", async () => {
    const open = van.state(true);
    const dom = Drawer(
      { open, dismissible: false, showClose: false },
      van.tags.p("Fijo"),
    ) as HTMLElement;
    mount(dom);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await tick();
    expect(open.val).toBe(true);

    (dom.firstElementChild as HTMLElement).dispatchEvent(new MouseEvent("click"));
    await tick();
    expect(open.val).toBe(true);
    expect(dom.querySelector("button")).toBeNull();
  });

  test("focus trap: Tab on the last element wraps to the first", async () => {
    const open = van.state(true);
    const dom = Drawer(
      { open, showClose: false },
      van.tags.div(
        van.tags.button({ id: "d-a" }, "A"),
        van.tags.button({ id: "d-b" }, "B"),
      ),
    ) as HTMLElement;
    mount(dom);
    await tick();
    const panel = dom.querySelector('[role="dialog"]') as HTMLElement;
    const last = panel.querySelector("#d-b") as HTMLButtonElement;

    last.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).toBe(panel.querySelector("#d-a"));

    (panel.querySelector("#d-a") as HTMLButtonElement).focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }));
    expect(document.activeElement).toBe(last);
  });

  test("top/bottom sides use translate-y", async () => {
    const { open, dom } = build("bottom");
    mount(dom);
    const panel = dom.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel.className).toContain("translate-y-full");
    open.val = true;
    await tick();
    expect(panel.className).toContain("translate-y-0");
  });

  test("modal: false → panel flotante no bloqueante (sin backdrop, sin scroll lock, sin focus trap)", async () => {
    const open = van.state(true);
    const dom = Drawer(
      { open, modal: false, showClose: false },
      van.tags.div(
        van.tags.button({ id: "nm-a" }, "A"),
        van.tags.button({ id: "nm-b" }, "B"),
      ),
    ) as HTMLElement;
    mount(dom);

    // En modo no-modal el panel es el nodo raíz (no hay wrapper ni backdrop).
    const panel = dom;
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("false");
    expect(dom.className).not.toContain("bg-overlay");
    expect(dom.classList.contains("fixed")).toBe(true);
    // Sin bloqueo de scroll mientras está abierto.
    expect(document.body.style.overflow).toBe("");
    // Sin focus trap: Tab no envuelve al llegar al último elemento.
    const last = panel.querySelector("#nm-b") as HTMLButtonElement;
    const first = panel.querySelector("#nm-a") as HTMLButtonElement;
    last.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).toBe(last);
    first.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }));
    expect(document.activeElement).toBe(first);
  });

  test("modal: false conserva Esc para cerrar si dismissible", async () => {
    const open = van.state(true);
    let closes = 0;
    const dom = Drawer(
      { open, modal: false, onClose: () => closes++ },
      van.tags.p("Hola"),
    ) as HTMLElement;
    mount(dom);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await tick();
    expect(open.val).toBe(false);
    expect(closes).toBe(1);
  });
});
