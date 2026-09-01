import { describe, test, expect } from "bun:test";
import {
  van,
  AppShell,
  Sidebar,
  SidebarItem,
  SidebarGroup,
  HeaderBar,
} from "../src/index.js";

const { div, span, button } = van.tags;

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
