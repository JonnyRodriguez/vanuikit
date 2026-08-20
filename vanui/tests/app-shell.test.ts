import { test, expect } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { van, Router, Nav } from "../src/index.js";

const { div } = van.tags;
const LINKS = [
  { href: "/a", label: "A" },
  { href: "/b", label: "B" },
];

function clickA(host: HTMLElement, href: string) {
  const link = host.querySelector(`a[href="${href}"]`) as HTMLAnchorElement;
  link.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}

// El shell es el patrón de App(): Nav reactivo al path + la vista resuelta por
// el router. Un solo click de Nav debe cambiar URL y vista.
test("shell: multiples clics actualizan vista y link activo", async () => {
  // Aislamiento: un DOM/history frescos (sin listeners de click de otros tests)
  GlobalRegistrator.unregister();
  GlobalRegistrator.register({ url: "http://localhost/" });

  const router = new Router();
  router
    .redirect("/", "/a")
    .add("/a", () => div("screen-a"))
    .add("/b", () => div("screen-b"));

  const shell = div({ class: "app-shell" }, () => Nav(LINKS, { current: router.path.val }), router.start());
  const host = document.createElement("div");
  van.add(host, shell);
  document.body.replaceChildren(host);

  await new Promise((r) => setTimeout(r, 5));
  expect(host.textContent).toContain("screen-a");
  expect(window.location.pathname).toBe("/a");

  clickA(host, "/b");
  await new Promise((r) => setTimeout(r, 5));
  expect(host.textContent).toContain("screen-b");
  expect(window.location.pathname).toBe("/b");

  clickA(host, "/a");
  await new Promise((r) => setTimeout(r, 5));
  expect(host.textContent).toContain("screen-a");
  expect(window.location.pathname).toBe("/a");
});