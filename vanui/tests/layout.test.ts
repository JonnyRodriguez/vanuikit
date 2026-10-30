import { describe, test, expect, beforeEach } from "bun:test";
import {
  van,
  AppShell,
  Sidebar,
  SidebarItem,
  SidebarGroup,
  HeaderBar,
} from "../src/index.js";

const { div, span, button } = van.tags;

// van 1.6 difiere la actualización del DOM a un microtask (updateDoms): los
// clicks en tests deben esperar un tick antes de asertar el DOM.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Layout & Dashboard Components", () => {
  test("SidebarItem > renderiza link o botón con label, icono y badge", () => {
    const item = SidebarItem({
      href: "/dashboard",
      label: "Tablero",
      icon: "📊",
      badge: "3",
      current: "/dashboard",
    });

    const host = document.createElement("div");
    van.add(host, item);

    const anchor = host.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe("/dashboard");
    expect(anchor?.getAttribute("aria-current")).toBe("page");
    expect(anchor?.textContent).toContain("Tablero");
    expect(anchor?.textContent).toContain("📊");
    expect(anchor?.textContent).toContain("3");
  });

  test("SidebarGroup > renderiza título y agrupa elementos hijos", () => {
    const group = SidebarGroup(
      { title: "Gestión" },
      SidebarItem({ href: "/items", label: "Artículos" }),
      SidebarItem({ href: "/orders", label: "Pedidos" }),
    );

    const host = document.createElement("div");
    van.add(host, group);

    expect(host.querySelector("h3")?.textContent).toBe("Gestión");
    expect(host.querySelectorAll("a").length).toBe(2);
  });

  test("HeaderBar > renderiza leading, título y acciones", () => {
    const header = HeaderBar({
      leading: button({ class: "menu-btn" }, "☰"),
      title: "Panel Principal",
      actions: span({ class: "user-pill" }, "Admin"),
    });

    const host = document.createElement("div");
    van.add(host, header);

    expect(host.querySelector(".menu-btn")?.textContent).toBe("☰");
    expect(host.querySelector("h1")?.textContent).toBe("Panel Principal");
    expect(host.querySelector(".user-pill")?.textContent).toBe("Admin");
  });

  test("AppShell > renderiza sidebar, header y content", async () => {
    const isOpen = van.state(false);

    const shell = AppShell({
      sidebarOpen: isOpen,
      sidebar: Sidebar({
        header: div("Logo Brand"),
        content: SidebarItem({ href: "/home", label: "Inicio" }),
      }),
      header: HeaderBar({
        title: "Dashboard",
      }),
      content: div("Contenido Principal"),
    });

    const host = document.createElement("div");
    van.add(host, shell);

    expect(host.textContent).toContain("Logo Brand");
    expect(host.textContent).toContain("Inicio");
    expect(host.textContent).toContain("Dashboard");
    expect(host.textContent).toContain("Contenido Principal");

    // Toggle sidebar state
    isOpen.val = true;
    const backdrop = host.querySelector(".app-shell-backdrop") as HTMLElement;
    const aside = host.querySelector(".app-shell-sidebar") as HTMLElement;
    expect(backdrop).not.toBeNull();
    expect(aside).not.toBeNull();
  });
});

describe("Sidebar colapsable (modo rail desktop)", () => {
  test("sin collapsible no renderiza el botón de colapso", () => {
    const host = document.createElement("div");
    van.add(
      host,
      Sidebar({ header: div("Logo"), content: SidebarItem({ href: "/a", label: "A" }) }),
    );

    expect(host.querySelector("aside button[aria-expanded]")).toBeNull();
  });

  test("colapso no controlado: alterna rail, oculta labels y persiste en localStorage", async () => {
    localStorage.clear();
    const key = "test-sidebar-key";
    // Conectar al documento: van descarta bindings de árboles detached (keepConnected)
    const host = document.createElement("div");
    document.body.appendChild(host);
    van.add(
      host,
      Sidebar({
        header: div("Logo"),
        content: SidebarItem({ href: "/a", label: "Artículos", icon: "📦" }),
        collapsible: true,
        storageKey: key,
      }),
    );

    const aside = host.querySelector("aside") as HTMLElement;
    const toggle = aside.querySelector("button[aria-expanded]") as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    expect(aside.className).toContain("w-64");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    // Nombre accesible del ítem intacto aunque el label se oculte en rail
    const item = aside.querySelector(".vui-sb-item") as HTMLElement;
    expect(item.getAttribute("aria-label")).toBe("Artículos");
    expect(aside.querySelector(".vui-sb-label")).not.toBeNull();

    toggle.click();
    await tick();

    // El rail solo aplica en desktop (lg:): en mobile el drawer queda expandido
    expect(aside.className).toContain("lg:w-20");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(aside.className).toContain('lg:[&_.vui-sb-label]:hidden');
    expect(localStorage.getItem(key)).toBe("1");

    // Una nueva instancia con la misma clave arranca colapsada (persistencia)
    host.remove();
    const host2 = document.createElement("div");
    document.body.appendChild(host2);
    van.add(
      host2,
      Sidebar({ content: SidebarItem({ href: "/b", label: "B" }), collapsible: true, storageKey: key }),
    );
    const aside2 = host2.querySelector("aside") as HTMLElement;
    expect(aside2.className).toContain("lg:w-20");
    expect(
      (host2.querySelector("button[aria-expanded]") as HTMLButtonElement).getAttribute("aria-expanded"),
    ).toBe("false");
    host2.remove();
  });

  test("colapso controlado: el state externo manda y el toggle lo actualiza", async () => {
    const collapsed = van.state(false);
    const host = document.createElement("div");
    document.body.appendChild(host);
    van.add(
      host,
      Sidebar({ content: SidebarItem({ href: "/c", label: "C" }), collapsible: true, collapsed }),
    );

    const toggle = host.querySelector("button[aria-expanded]") as HTMLButtonElement;
    toggle.click();
    await tick();
    expect(collapsed.val).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    collapsed.val = false;
    await tick();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    host.remove();
  });
});

describe("Sidebar resizable (drag horizontal)", () => {
  beforeEach(() => localStorage.clear());

  const mountSidebar = (props: Record<string, unknown> = {}) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    van.add(
      host,
      Sidebar({
        header: div("Logo"),
        content: SidebarItem({ href: "/a", label: "A" }),
        resizable: true,
        ...props,
      } as any),
    );
    const aside = host.querySelector("aside") as HTMLElement;
    const resizer = aside.querySelector(".vui-sb-resizer") as HTMLElement;
    return { host, aside, resizer };
  };

  test("sin resizable no renderiza el separador de resize", () => {
    const host = document.createElement("div");
    van.add(host, Sidebar({ header: div("Logo"), content: SidebarItem({ href: "/a", label: "A" }) }));
    expect(host.querySelector(".vui-sb-resizer")).toBeNull();
    host.remove();
  });

  test("resizable: renderiza separador con aria y ancho por defecto", () => {
    const { resizer, aside } = mountSidebar();
    expect(resizer).not.toBeNull();
    expect(resizer.getAttribute("role")).toBe("separator");
    expect(resizer.getAttribute("aria-orientation")).toBe("vertical");
    expect(resizer.getAttribute("aria-valuenow")).toBe("256");
    expect(resizer.getAttribute("aria-valuemin")).toBe("224");
    expect(resizer.getAttribute("aria-valuemax")).toBe("384");
    expect(resizer.getAttribute("aria-label")).toBe("Ajustar ancho de la barra lateral");
    expect(aside.style.width).toBe("256px");
  });

  test("drag del separador actualiza el ancho y persiste en localStorage", async () => {
    const { resizer, aside } = mountSidebar();

    resizer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 300 }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 340 }));
    window.dispatchEvent(new PointerEvent("pointerup"));
    await tick();

    expect(aside.style.width).toBe("296px"); // 256 + 40
    expect(localStorage.getItem("vanui-sidebar-width")).toBe("296");
  });

  test("drag respeta ancho mínimo y máximo", async () => {
    const { resizer, aside } = mountSidebar();

    resizer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 300 }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 2000 }));
    window.dispatchEvent(new PointerEvent("pointerup"));
    await tick();
    expect(aside.style.width).toBe("384px"); // clamp max

    resizer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 300 }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: -2000 }));
    window.dispatchEvent(new PointerEvent("pointerup"));
    await tick();
    expect(aside.style.width).toBe("224px"); // clamp min
  });

  test("teclado: flechas ajustan el ancho en pasos de 16px", async () => {
    const { resizer, aside } = mountSidebar();

    resizer.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(aside.style.width).toBe("272px");

    resizer.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await tick();
    expect(aside.style.width).toBe("256px");
  });

  test("ancho inicial desde localStorage y límites configurables", () => {
    localStorage.setItem("vanui-sidebar-width", "999");
    const { aside } = mountSidebar({ maxWidth: 400 });
    expect(aside.style.width).toBe("400px"); // clamp al máximo configurable

    localStorage.setItem("vanui-sidebar-width", "300");
    const { resizer } = mountSidebar({ minWidth: 250, maxWidth: 350 });
    expect(resizer.getAttribute("aria-valuemin")).toBe("250");
    expect(resizer.getAttribute("aria-valuemax")).toBe("350");
    expect(resizer.getAttribute("aria-valuenow")).toBe("300");
  });
});
