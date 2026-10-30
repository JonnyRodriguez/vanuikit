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
describe("Router deny-by-default", () => {
  test("el guard global protege las rutas no públicas y respeta publicRoutes", async () => {
    const visited: string[] = [];
    const router = new Router({
      guard: (ctx) => {
        visited.push(ctx.to);
        return "/login";
      },
      publicRoutes: ["/login", "/docs/*"],
    });
    router
      .add("/login", () => div("login-page"))
      .add("/dashboard", () => div("dashboard-page"))
      .add("/docs/guide", () => div("docs-page"))
      .add("/admin", () => div("admin-page"));

    const host = mount(router);

    // Pública declarada: el guard ni se entera
    await router.navigate("/login");
    expect(host.textContent).toContain("login-page");
    expect(visited).toEqual([]);

    // Protegida por defecto (no declara nada): el guard redirige a /login
    await router.navigate("/dashboard");
    expect(visited).toEqual(["/dashboard"]);
    expect(host.textContent).toContain("login-page");
    expect(host.textContent).not.toContain("dashboard-page");

    // Wildcard de cola: /docs/* cubre /docs/guide
    await router.navigate("/docs/guide");
    expect(host.textContent).toContain("docs-page");
    expect(visited).toEqual(["/dashboard"]);

    // Sin wildcard que la cubra: también protegida
    await router.navigate("/admin");
    expect(visited).toEqual(["/dashboard", "/admin"]);
    expect(host.textContent).toContain("login-page");
  });

  test("el guard global corre ANTES del beforeEnter explícito de la ruta", async () => {
    const order: string[] = [];
    const router = new Router({
      guard: () => {
        order.push("global");
      },
      publicRoutes: ["/login"],
    });
    router.add("/admin", () => div("admin"), {
      beforeEnter: () => {
        order.push("route");
      },
    });

    const host = mount(router);

    await router.navigate("/admin");
    expect(order).toEqual(["global", "route"]);
    expect(host.textContent).toContain("admin");
  });

  test("sin guard en options el comportamiento es el de siempre", async () => {
    const router = new Router();
    router.add("/open", () => div("open"));
    const host = mount(router);

    await router.navigate("/open");
    expect(host.textContent).toContain("open");
  });

  test("redirect reemplaza su entrada del historial: back regresa al origen", async () => {
    const router = new Router();
    router
      .redirect("/", "/***REMOVED***")
      .add("/***REMOVED***", () => div("***REMOVED***-page"))
      .add("/components", () => div("components-page"));
    const host = mount(router);

    await router.navigate("/components");
    const lenAtComponents = history.length;

    // Click en un enlace a "/" (alias): push de "/" y el redirect reemplaza
    // esa entrada por "/***REMOVED***" — un solo push en total.
    await router.navigate("/");
    expect(router.path.val).toBe("/***REMOVED***");
    expect(window.location.pathname).toBe("/***REMOVED***");
    expect(history.length).toBe(lenAtComponents + 1);

    // BACK: regresa a components (sin el fix, "/" rebotaba a /***REMOVED***).
    history.back();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(router.path.val).toBe("/components");
    expect(host.textContent).toContain("components-page");
  });

  test("redirect del guard también reemplaza: back regresa al origen sin rebotes", async () => {
    // Escenario del breadcrumb con usuario NO autenticado: "/" → alias a
    // /***REMOVED*** (protegida) → el guard manda a /login. Ambos saltos deben
    // reemplazar entrada para que back regrese a /components.
    const router = new Router({
      guard: () => "/login",
      publicRoutes: ["/login", "/components"],
    });
    router
      .redirect("/", "/***REMOVED***")
      .add("/***REMOVED***", () => div("***REMOVED***-page"))
      .add("/components", () => div("components-page"))
      .add("/login", () => div("login-page"));
    const host = mount(router);
    // La sesión de historial se comparte entre tests: partir de /login
    // garantiza que las dos navegaciones siguientes SÍ apilen.
    await router.navigate("/login");
    await router.navigate("/components");
    const lenAtComponents = history.length;

    await router.navigate("/"); // alias protegido: redirect + guard, 1 push total
    expect(router.path.val).toBe("/login");
    expect(window.location.pathname).toBe("/login");
    expect(history.length).toBe(lenAtComponents + 1);

    history.back();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(router.path.val).toBe("/components");
    expect(host.textContent).toContain("components-page");
  });
});
