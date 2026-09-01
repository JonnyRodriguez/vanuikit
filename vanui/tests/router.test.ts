import { describe, test, expect } from "bun:test";
import { van, Router, createRouter, navigate, createAuth, requireAuth } from "../src/index.js";

const { div } = van.tags;

/** Monta el router en un contenedor aislado (van.add enlaza el binding reactivo). */
function mount(router: Router): HTMLElement {
  const host = document.createElement("div");
  van.add(host, router.start());
  document.body.replaceChildren(host);
  return host;
}

describe("Router", () => {
  test("matchea rutas con params y los pasa al componente", async () => {
    const router = new Router();
    router
      .add("/product/:id", ({ params }) => div("product-" + params.id))
      .add("/login", () => div("login-page"));

    const host = mount(router);

    await router.navigate("/product/42");
    expect(host.textContent).toContain("product-42");
    expect(router.path.val).toBe("/product/42");
  });

  test("decodifica params URL-encoded", async () => {
    const router = new Router();
    router.add("/search/:query", ({ params }) => div("q=" + params.query));

    const host = mount(router);

    await router.navigate("/search/hello%20world");
    expect(host.textContent).toContain("q=hello world");
  });

  test("usa el notFound para rutas sin match", async () => {
    const router = new Router();
    router
      .add("/login", () => div("login-page"))
      .setNotFound(() => div("404 - no existe"));

    const host = mount(router);

    await router.navigate("/no/existe");
    expect(host.textContent).toContain("404 - no existe");
  });

  test("una redirección manda directo al destino", async () => {
    const router = new Router();
    router
      .redirect("/", "/login")
      .add("/login", () => div("login-page"));

    const host = mount(router);

    await router.navigate("/");
    expect(host.textContent).toContain("login-page");
    expect(router.path.val).toBe("/login");
  });

  test("beforeEnter redirige cuando no hay sesión (requireAuth)", async () => {
    const auth = createAuth({
      me: async () => ({ user: null }),
      login: async () => ({ user: { id: "1", email: "a@b.com" } }),
      logout: async () => {},
    });

    const router = new Router();
    router
      .add("/private", () => div("private-area"), {
        beforeEnter: requireAuth(auth, "/login"),
      })
      .add("/login", () => div("login-page"));

    const host = mount(router);

    // Sin sesión → guard redirige a login
    await router.navigate("/private");
    expect(host.textContent).toContain("login-page");

    // Con sesión → entra a la ruta privada
    await auth.login("a@b.com", "x");
    await router.navigate("/private");
    expect(host.textContent).toContain("private-area");
  });

  test("beforeEnter con false bloquea la navegación", async () => {
    const router = new Router();
    router
      .add("/blocked", () => div("never-shown"), {
        beforeEnter: () => false,
      })
      .add("/home", () => div("home"));

    const host = mount(router);

    await router.navigate("/home");
    expect(host.textContent).toContain("home");

    await router.navigate("/blocked");
    expect(host.textContent).toContain("home");
    expect(host.textContent).not.toContain("never-shown");
  });

  test("helper global navigate() usa el router activo", async () => {
    const router = createRouter();
    router
      .add("/page-a", () => div("page-a"))
      .add("/page-b", () => div("page-b"));

    const host = mount(router);

    await navigate("/page-a");
    expect(host.textContent).toContain("page-a");

    await navigate("/page-b");
    expect(host.textContent).toContain("page-b");
  });
});