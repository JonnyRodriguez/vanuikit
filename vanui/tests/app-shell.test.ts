import { test, expect } from "bun:test";
import { van, Router, Nav } from "../src/index.js";

const { div } = van.tags;
const LINKS = [
  { href: "/a", label: "A" },
  { href: "/b", label: "B" },
];

const tick = () => new Promise((r) => setTimeout(r, 0));

function clickA(host: HTMLElement, href: string) {
  const link = host.querySelector(`a[href="${href}"]`) as HTMLAnchorElement;
  link.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}

// El shell es el patrón de App(): Nav reactivo al path + la vista resuelta por
// el router. Un solo click de Nav debe cambiar URL y vista.
test("shell: multiples clics actualizan vista y link activo", async () => {
  const router = new Router();
  router
    .redirect("/", "/a")
    .add("/a", () => div({ id: "view-a" }, "Vista A"))
    .add("/b", () => div({ id: "view-b" }, "Vista B"));

  // Sincronizar estado inicial
  window.history.pushState(null, "", "/");

  const host = div(
    Nav(LINKS, { current: router.path }),
    router.start(),
  ) as HTMLElement;

  document.body.replaceChildren(host);
  await router.navigate("/");
  await tick();

  // / redirigió a /a
  expect(router.path.val).toBe("/a");
  expect(host.querySelector("#view-a")).not.toBeNull();
  expect(host.querySelector('a[href="/a"]')?.getAttribute("aria-current")).toBe("page");

  // Click en B
  clickA(host, "/b");
  await tick();
  expect(router.path.val).toBe("/b");
  expect(host.querySelector("#view-b")).not.toBeNull();
  expect(host.querySelector('a[href="/b"]')?.getAttribute("aria-current")).toBe("page");
  expect(host.querySelector('a[href="/a"]')?.getAttribute("aria-current")).toBeNull();
});
