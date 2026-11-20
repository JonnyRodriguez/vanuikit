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

// van 1.6 defers DOM updates to a microtask (updateDoms): clicks in tests
// must wait a tick before asserting the DOM.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Layout & Dashboard Components", () => {
  test("SidebarItem > renders link or button with label, icon and badge", () => {
    const item = SidebarItem({
      href: "/dashboard",
      label: "Board",
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
    expect(anchor?.textContent).toContain("Board");
    expect(anchor?.textContent).toContain("📊");
    expect(anchor?.textContent).toContain("3");
  });

  test("SidebarGroup > renders title and groups child items", () => {
    const group = SidebarGroup(
      { title: "Management" },
      SidebarItem({ href: "/items", label: "Articles" }),
      SidebarItem({ href: "/orders", label: "Orders" }),
    );

    const host = document.createElement("div");
    van.add(host, group);

    expect(host.querySelector("h3")?.textContent).toBe("Management");
    expect(host.querySelectorAll("a").length).toBe(2);
  });

  test("HeaderBar > renders leading, title and actions", () => {
    const header = HeaderBar({
      leading: button({ class: "menu-btn" }, "☰"),
      title: "Main Panel",
      actions: span({ class: "user-pill" }, "Admin"),
    });

    const host = document.createElement("div");
    van.add(host, header);

    expect(host.querySelector(".menu-btn")?.textContent).toBe("☰");
    expect(host.querySelector("h1")?.textContent).toBe("Main Panel");
    expect(host.querySelector(".user-pill")?.textContent).toBe("Admin");
  });

  test("AppShell > renders sidebar, header and content", async () => {
    const isOpen = van.state(false);

    const shell = AppShell({
      sidebarOpen: isOpen,
      sidebar: Sidebar({
        header: div("Logo Brand"),
        content: SidebarItem({ href: "/home", label: "Home" }),
      }),
      header: HeaderBar({
        title: "Dashboard",
      }),
      content: div("Main Content"),
    });

    const host = document.createElement("div");
    van.add(host, shell);

    expect(host.textContent).toContain("Logo Brand");
    expect(host.textContent).toContain("Home");
    expect(host.textContent).toContain("Dashboard");
    expect(host.textContent).toContain("Main Content");

    // Toggle sidebar state
    isOpen.val = true;
    const backdrop = host.querySelector(".app-shell-backdrop") as HTMLElement;
    const aside = host.querySelector(".app-shell-sidebar") as HTMLElement;
    expect(backdrop).not.toBeNull();
    expect(aside).not.toBeNull();
  });
});

describe("Collapsible Sidebar (desktop rail mode)", () => {
  test("without collapsible does not render the collapse button", () => {
    const host = document.createElement("div");
    van.add(
      host,
      Sidebar({ header: div("Logo"), content: SidebarItem({ href: "/a", label: "A" }) }),
    );

    expect(host.querySelector("aside button[aria-expanded]")).toBeNull();
  });

  test("uncontrolled collapse: toggles rail, hides labels and persists to localStorage", async () => {
    localStorage.clear();
    const key = "test-sidebar-key";
    // Connect to the document: van discards bindings of detached trees (keepConnected)
    const host = document.createElement("div");
    document.body.appendChild(host);
    van.add(
      host,
      Sidebar({
        header: div("Logo"),
        content: SidebarItem({ href: "/a", label: "Articles", icon: "📦" }),
        collapsible: true,
        storageKey: key,
      }),
    );

    const aside = host.querySelector("aside") as HTMLElement;
    const toggle = aside.querySelector("button[aria-expanded]") as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    expect(aside.className).toContain("w-64");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    // Item's accessible name intact even though the label hides in rail
    const item = aside.querySelector(".vui-sb-item") as HTMLElement;
    expect(item.getAttribute("aria-label")).toBe("Articles");
    expect(aside.querySelector(".vui-sb-label")).not.toBeNull();

    toggle.click();
    await tick();

    // The rail only applies on desktop (lg:): on mobile the drawer stays expanded
    expect(aside.className).toContain("lg:w-20");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(aside.className).toContain('lg:[&_.vui-sb-label]:hidden');
    expect(localStorage.getItem(key)).toBe("1");

    // A new instance with the same key starts collapsed (persistence)
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

  test("controlled collapse: the external state drives and the toggle updates it", async () => {
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

describe("Resizable Sidebar (horizontal drag)", () => {
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

  test("without resizable does not render the resize handle", () => {
    const host = document.createElement("div");
    van.add(host, Sidebar({ header: div("Logo"), content: SidebarItem({ href: "/a", label: "A" }) }));
    expect(host.querySelector(".vui-sb-resizer")).toBeNull();
    host.remove();
  });

  test("resizable: renders handle with aria and default width", () => {
    const { resizer, aside } = mountSidebar();
    expect(resizer).not.toBeNull();
    expect(resizer.getAttribute("role")).toBe("separator");
    expect(resizer.getAttribute("aria-orientation")).toBe("vertical");
    expect(resizer.getAttribute("aria-valuenow")).toBe("256");
    expect(resizer.getAttribute("aria-valuemin")).toBe("224");
    expect(resizer.getAttribute("aria-valuemax")).toBe("384");
    expect(resizer.getAttribute("aria-label")).toBe("Resize sidebar");
    expect(aside.style.width).toBe("256px");
  });

  test("dragging the handle updates the width and persists to localStorage", async () => {
    const { resizer, aside } = mountSidebar();

    resizer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 300 }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 340 }));
    window.dispatchEvent(new PointerEvent("pointerup"));
    await tick();

    expect(aside.style.width).toBe("296px"); // 256 + 40
    expect(localStorage.getItem("vanuikit-sidebar-width")).toBe("296");
  });

  test("drag respects minimum and maximum width", async () => {
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

  test("keyboard: arrows adjust the width in 16px steps", async () => {
    const { resizer, aside } = mountSidebar();

    resizer.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await tick();
    expect(aside.style.width).toBe("272px");

    resizer.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await tick();
    expect(aside.style.width).toBe("256px");
  });

  test("initial width from localStorage and configurable bounds", () => {
    localStorage.setItem("vanuikit-sidebar-width", "999");
    const { aside } = mountSidebar({ maxWidth: 400 });
    expect(aside.style.width).toBe("400px"); // clamped to the configurable max

    localStorage.setItem("vanuikit-sidebar-width", "300");
    const { resizer } = mountSidebar({ minWidth: 250, maxWidth: 350 });
    expect(resizer.getAttribute("aria-valuemin")).toBe("250");
    expect(resizer.getAttribute("aria-valuemax")).toBe("350");
    expect(resizer.getAttribute("aria-valuenow")).toBe("300");
  });
});
