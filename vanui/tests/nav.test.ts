import { describe, test, expect } from "bun:test";
import { Nav } from "../src/components/nav.js";

const LINKS = [
  { href: "./index.html", label: "Recarga" },
  { href: "./login.html", label: "Login" },
  { href: "./register.html", label: "Registro" },
  { href: "./components.html", label: "Componentes" },
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
});
