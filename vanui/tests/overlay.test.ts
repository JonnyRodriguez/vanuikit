import { describe, test, expect, afterEach } from "bun:test";
import van from "vanjs-core";
import { Tooltip } from "../src/components/tooltip.js";
import { Popover } from "../src/components/popover.js";
import { Drawer } from "../src/components/drawer.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS actualiza los bindings en un microtask; hay que esperarlo.
const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  document.body.style.overflow = "";
});

describe("Tooltip", () => {
  test("oculto por defecto; focusin lo muestra al instante y focusout lo esconde", async () => {
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

  test("mouseenter muestra (delay 0) y mouseleave esconde", async () => {
    const el = mount(
      Tooltip({ content: "Hola", delay: 0, position: "left" }, van.tags.button("X")) as HTMLElement,
    );
    el.dispatchEvent(new MouseEvent("mouseenter"));
    await tick();
    const bubble = el.querySelector('[role="tooltip"]') as HTMLElement;
    expect(bubble.textContent).toBe("Hola");
    expect(bubble.className).toContain("-translate-y-1/2"); // posición left
    expect(bubble.className).toContain("mr-2");
    expect(bubble.className).not.toContain("hidden");

    el.dispatchEvent(new MouseEvent("mouseleave"));
    await tick();
    expect(bubble.className).toContain("hidden");
  });

  test("disabled bloquea hover y focus", async () => {
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

  test("contenido reactivo (State) llega a la burbuja", async () => {
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

  test("click alterna el panel con aria-expanded y role=dialog", async () => {
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

  test("Escape cierra y devuelve el foco al trigger", async () => {
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

  test("click fuera cierra; click dentro (incluido el trigger) no", async () => {
    const el = mount(build() as HTMLElement);
    (el.querySelector("#pop-trigger") as HTMLButtonElement).click();
    await tick();
    const panel = el.querySelector('[role="dialog"]') as HTMLElement;

    // Click dentro del panel (burbujea hasta document): el handler de
    // documento lo ve como "dentro del container" y no cierra.
    panel.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await tick();
    expect(panel.className).not.toContain("hidden");

    // Click fuera (target = body): cierra.
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await tick();
    expect(panel.className).toContain("hidden");
  });

  test("close() del panel funciona y limpia listeners", async () => {
    const el = mount(build() as HTMLElement);
    (el.querySelector("#pop-trigger") as HTMLButtonElement).click();
    await tick();
    (el.querySelector("#pop-close") as HTMLButtonElement).click();
    await tick();
    expect((el.querySelector('[role="dialog"]') as HTMLElement).className).toContain("hidden");

    // Sin listeners residuales: un click documental ya no rompe nada
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

  test("el State controla la visibilidad con clases de lado y aria-hidden", async () => {
    const { open, dom } = build("right");
    mount(dom);
    const panel = dom.querySelector('[role="dialog"]') as HTMLElement;

    expect(panel.className).toContain("translate-x-full");
    expect(dom.getAttribute("aria-hidden")).toBe("true");

    open.val = true;
    await tick();
    expect(panel.className).toContain("translate-x-0");
    expect(dom.getAttribute("aria-hidden")).toBe("false");
    expect(document.body.style.overflow).toBe("hidden"); // scroll lock

    open.val = false;
    await tick();
    expect(panel.className).toContain("translate-x-full");
    expect(document.body.style.overflow).toBe(""); // scroll liberado
  });

  test("Escape cierra (dismissible), avisa onClose y devuelve el foco", async () => {
    const { open, dom, getCloses } = build("left");
    mount(dom);
    // El opener debe existir DESPUÉS del mount (replaceChildren lo limpiaría).
    const opener = van.tags.button("Abrir");
    document.body.append(opener);
    opener.focus();

    open.val = true;
    await tick();
    // El foco entró al panel
    expect(document.activeElement?.closest('[role="dialog"]')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await tick();
    expect(open.val).toBe(false);
    expect(getCloses()).toBe(1);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  test("click en el backdrop cierra; click en el panel no", async () => {
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

  test("dismissible: false desactiva Esc y backdrop; showClose: false quita el botón", async () => {
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

  test("trampa de foco: Tab en el último elemento vuelve al primero", async () => {
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

  test("lados top/bottom usan translate-y", async () => {
    const { open, dom } = build("bottom");
    mount(dom);
    const panel = dom.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel.className).toContain("translate-y-full");
    open.val = true;
    await tick();
    expect(panel.className).toContain("translate-y-0");
  });
});
