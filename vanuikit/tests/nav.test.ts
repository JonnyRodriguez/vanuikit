import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { Nav, Link } from "../src/components/nav.js";

const { state } = van;

// van's bindings flush on a microtask: reactive tests wait a tick.
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const click = (el: HTMLElement, init: MouseEventInit = {}) =>
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, ...init }));

/**
 * Did the COMPONENT decide to intercept the click? Reads defaultPrevented
 * when it reaches the anchor's own listeners (spaClick runs before this
 * probe), without depending on router.start()'s global interceptor:
 * happy-dom keeps it installed across test files and, by following the
 * anchors' default action, mutates window.location between tests.
 */
const componentPrevents = (el: HTMLElement, init: MouseEventInit = {}) => {
  let prevented = false;
  const probe = (e: Event) => {
    prevented = e.defaultPrevented;
  };
  el.addEventListener("click", probe);
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
  el.removeEventListener("click", probe);
  return prevented;
};

const LINKS = [
  { href: "./index.html", label: "Home" },
  { href: "./login.html", label: "Login" },
  { href: "./register.html", label: "Register" },
  { href: "./components.html", label: "Components" },
];

const ROUTE_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/components", label: "Components" },
];

describe("Nav", () => {
  test("renders one link per item, with href and label", () => {
    const nav = Nav(LINKS, { current: "./index.html" });
    document.body.replaceChildren(nav);
    const anchors = [...document.body.querySelectorAll("a")];
    expect(anchors).toHaveLength(4);
    expect(anchors[1].getAttribute("href")).toBe("./login.html");
    expect(anchors[1].textContent).toBe("Login");
  });

  test("marks the current link with aria-current=page and active class", () => {
    const nav = Nav(LINKS, { current: "./register.html" });
    document.body.replaceChildren(nav);
    const active = document.body.querySelector(
      '[aria-current="page"]',
    ) as HTMLElement;
    expect(active).not.toBeNull();
    expect(active.textContent).toBe("Register");
    expect(active.className).toContain("text-accent");
    expect(active.className).toContain("font-bold");
  });

  test("only one link carries aria-current", () => {
    const nav = Nav(LINKS, { current: "./index.html" });
    document.body.replaceChildren(nav);
    const actives = document.body.querySelectorAll('[aria-current="page"]');
    expect(actives).toHaveLength(1);
  });

  test("marks active by subroute: /dashboard/config activates /dashboard", () => {
    const nav = Nav(ROUTE_LINKS, { current: "/dashboard/config" });
    document.body.replaceChildren(nav);
    const active = document.body.querySelector('[aria-current="page"]');
    expect(active?.textContent).toBe("Dashboard");
  });

  test("the active item updates reactively when current changes", async () => {
    const current = state("/dashboard");
    const nav = Nav(ROUTE_LINKS, { current });
    document.body.replaceChildren(nav);
    expect(document.querySelector('[aria-current="page"]')?.textContent).toBe("Dashboard");

    current.val = "/components";
    await flush();
    expect(document.querySelector('[aria-current="page"]')?.textContent).toBe("Components");
  });

  test("default aria-label via i18n, overridable by prop", () => {
    const nav = Nav(LINKS, { current: "./index.html" });
    document.body.replaceChildren(nav);
    // The singleton boots in "en": resolves from the dictionary, not the Spanish default.
    expect(nav.getAttribute("aria-label")).toBe("Main navigation");

    const navCustom = Nav(LINKS, { current: "./index.html", ariaLabel: "Main menu" });
    document.body.replaceChildren(navCustom);
    expect(navCustom.getAttribute("aria-label")).toBe("Main menu");
  });

  test("clicks navigate embedded: preventDefault only on internal routes", () => {
    const nav = Nav([{ href: "/dashboard", label: "Dashboard" }], { current: "/other" });
    document.body.replaceChildren(nav);
    const internal = nav.querySelector("a") as HTMLElement;
    expect(componentPrevents(internal)).toBe(true);

    const navExt = Nav([{ href: "https://example.com", label: "External" }], { current: "/other" });
    document.body.replaceChildren(navExt);
    const external = navExt.querySelector("a") as HTMLElement;
    expect(componentPrevents(external)).toBe(false);
  });
});

describe("Link", () => {
  test("renders an anchor with href, accent variant by default and extra class", () => {
    const link = Link({ href: "/dashboard", class: "my-extra" }, "View dashboard");
    document.body.replaceChildren(link);
    expect(link.getAttribute("href")).toBe("/dashboard");
    expect(link.textContent).toBe("View dashboard");
    expect(link.className).toContain("text-accent");
    expect(link.className).toContain("my-extra");
  });

  test("button variant shares the primary button tokens", () => {
    const link = Link({ href: "/login", variant: "button" }, "Enter");
    document.body.replaceChildren(link);
    expect(link.className).toContain("bg-primary");
    expect(link.className).toContain("text-primary-fg");
  });

  test("internal click delegates to the router; with Ctrl or external href navigates natively", () => {
    const link = Link({ href: "/dashboard" }, "x");
    document.body.replaceChildren(link);
    expect(componentPrevents(link)).toBe(true);
    expect(componentPrevents(link, { ctrlKey: true })).toBe(false);

    const ext = Link({ href: "https://example.com" }, "x");
    document.body.replaceChildren(ext);
    expect(componentPrevents(ext)).toBe(false);
  });

  test("target=_blank adds rel=noopener noreferrer unless rel is explicit", () => {
    const auto = Link({ href: "https://example.com", target: "_blank" }, "x");
    expect(auto.getAttribute("rel")).toBe("noopener noreferrer");

    const explicit = Link({ href: "https://example.com", target: "_blank", rel: "external" }, "x");
    expect(explicit.getAttribute("rel")).toBe("external");

    const internal = Link({ href: "/dashboard" }, "x");
    expect(internal.getAttribute("rel")).toBeNull();
  });

  test("a consumer preventDefault cancels the SPA navigation", () => {
    const link = Link({ href: "/dashboard", onclick: (e) => e.preventDefault() }, "x");
    document.body.replaceChildren(link);
    // Already prevented by the consumer: spaClick respects the decision and does not navigate.
    expect(click(link)).toBe(false);
  });
});
