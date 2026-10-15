import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { Nav, Link } from "../src/components/nav.js";

const { state } = van;

// Los bindings de van descargan al microtask: los tests reactivos esperan un tick.
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const click = (el: HTMLElement, init: MouseEventInit = {}) =>
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, ...init }));

/**
 * ¿Decidió el COMPONENTE interceptar el click? Lee defaultPrevented al llegar
 * a los listeners del propio anchor (spaClick corre antes que este probe), sin
 * depender del interceptor global de `router.start()`: happy-dom lo deja
 * instalado entre archivos de test y, al seguir la acción por defecto de los
 * anchors, muta window.location entre tests.
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
  { href: "./index.html", label: "Recarga" },
  { href: "./login.html", label: "Login" },
  { href: "./register.html", label: "Registro" },
  { href: "./components.html", label: "Componentes" },
];

const ROUTE_LINKS = [
  { href: "/gateways", label: "Pasarelas" },
  { href: "/components", label: "Componentes" },
];

describe("Nav", () => {
  test("renderiza un link por item, con href y label", () => {
    const nav = Nav(LINKS, { current: "./index.html" });
    document.body.replaceChildren(nav);
    const anchors = [...document.body.querySelectorAll("a")];
    expect(anchors).toHaveLength(4);
    expect(anchors[1].getAttribute("href")).toBe("./login.html");
    expect(anchors[1].textContent).toBe("Login");
  });

  test("marca el link actual con aria-current=page y clase activa", () => {
    const nav = Nav(LINKS, { current: "./register.html" });
    document.body.replaceChildren(nav);
    const active = document.body.querySelector(
      '[aria-current="page"]',
    ) as HTMLElement;
    expect(active).not.toBeNull();
    expect(active.textContent).toBe("Registro");
    expect(active.className).toContain("text-accent");
    expect(active.className).toContain("font-bold");
  });

  test("solo un link lleva aria-current", () => {
    const nav = Nav(LINKS, { current: "./index.html" });
    document.body.replaceChildren(nav);
    const actives = document.body.querySelectorAll('[aria-current="page"]');
    expect(actives).toHaveLength(1);
  });

  test("marca el activo por subruta: /gateways/abc activa /gateways", () => {
    const nav = Nav(ROUTE_LINKS, { current: "/gateways/abc" });
    document.body.replaceChildren(nav);
    const active = document.body.querySelector('[aria-current="page"]');
    expect(active?.textContent).toBe("Pasarelas");
  });

  test("el activo se actualiza de forma reactiva al cambiar current", async () => {
    const current = state("/gateways");
    const nav = Nav(ROUTE_LINKS, { current });
    document.body.replaceChildren(nav);
    expect(document.querySelector('[aria-current="page"]')?.textContent).toBe("Pasarelas");

    current.val = "/components";
    await flush();
    expect(document.querySelector('[aria-current="page"]')?.textContent).toBe("Componentes");
  });

  test("aria-label por defecto vía i18n, overridable por prop", () => {
    const nav = Nav(LINKS, { current: "./index.html" });
    document.body.replaceChildren(nav);
    // El singleton arranca en "en": resuelve del diccionario, no del default español.
    expect(nav.getAttribute("aria-label")).toBe("Main navigation");

    const navCustom = Nav(LINKS, { current: "./index.html", ariaLabel: "Menú principal" });
    document.body.replaceChildren(navCustom);
    expect(navCustom.getAttribute("aria-label")).toBe("Menú principal");
  });

  test("los clicks navegan embebidos: preventDefault solo en rutas internas", () => {
    const nav = Nav([{ href: "/gateways", label: "Pasarelas" }], { current: "/other" });
    document.body.replaceChildren(nav);
    const internal = nav.querySelector("a") as HTMLElement;
    expect(componentPrevents(internal)).toBe(true);

    const navExt = Nav([{ href: "https://example.com", label: "Externo" }], { current: "/other" });
    document.body.replaceChildren(navExt);
    const external = navExt.querySelector("a") as HTMLElement;
    expect(componentPrevents(external)).toBe(false);
  });
});

describe("Link", () => {
  test("renderiza ancla con href, variante accent por defecto y class extra", () => {
    const link = Link({ href: "/gateways", class: "my-extra" }, "Ver pasarelas");
    document.body.replaceChildren(link);
    expect(link.getAttribute("href")).toBe("/gateways");
    expect(link.textContent).toBe("Ver pasarelas");
    expect(link.className).toContain("text-accent");
    expect(link.className).toContain("my-extra");
  });

  test("variante button comparte los tokens del botón primario", () => {
    const link = Link({ href: "/login", variant: "button" }, "Entrar");
    document.body.replaceChildren(link);
    expect(link.className).toContain("bg-primary");
    expect(link.className).toContain("text-primary-fg");
  });

  test("click interno delega en el router; con Ctrl o href externo navega nativo", () => {
    const link = Link({ href: "/gateways" }, "x");
    document.body.replaceChildren(link);
    expect(componentPrevents(link)).toBe(true);
    expect(componentPrevents(link, { ctrlKey: true })).toBe(false);

    const ext = Link({ href: "https://example.com" }, "x");
    document.body.replaceChildren(ext);
    expect(componentPrevents(ext)).toBe(false);
  });

  test("target=_blank añade rel=noopener noreferrer salvo rel explícito", () => {
    const auto = Link({ href: "https://example.com", target: "_blank" }, "x");
    expect(auto.getAttribute("rel")).toBe("noopener noreferrer");

    const explicit = Link({ href: "https://example.com", target: "_blank", rel: "external" }, "x");
    expect(explicit.getAttribute("rel")).toBe("external");

    const internal = Link({ href: "/gateways" }, "x");
    expect(internal.getAttribute("rel")).toBeNull();
  });

  test("un preventDefault del consumidor cancela la navegación SPA", () => {
    const link = Link({ href: "/gateways", onclick: (e) => e.preventDefault() }, "x");
    document.body.replaceChildren(link);
    // Ya viene prevenido por el consumidor: spaClick respeta la decisión y no navega.
    expect(click(link)).toBe(false);
  });
});
