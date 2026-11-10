import { describe, test, expect } from "bun:test";
import { van, Router, createRouter, navigate, createAuth, requireAuth } from "../src/index.js";

const { div } = van.tags;

/** Mounts the router in an isolated container (van.add links the reactive binding). */
function mount(router: Router): HTMLElement {
  const host = document.createElement("div");
  van.add(host, router.start());
  document.body.replaceChildren(host);
  return host;
}

describe("Router", () => {
  test("matches routes with params and passes them to the component", async () => {
    const router = new Router();
    router
      .add("/product/:id", ({ params }) => div("product-" + params.id))
      .add("/login", () => div("login-page"));

    const host = mount(router);

    await router.navigate("/product/42");
    expect(host.textContent).toContain("product-42");
    expect(router.path.val).toBe("/product/42");
  });

  test("decodes URL-encoded params", async () => {
    const router = new Router();
    router.add("/search/:query", ({ params }) => div("q=" + params.query));

    const host = mount(router);

    await router.navigate("/search/hello%20world");
    expect(host.textContent).toContain("q=hello world");
  });

  test("uses notFound for unmatched routes", async () => {
    const router = new Router();
    router
      .add("/login", () => div("login-page"))
      .setNotFound(() => div("404 - not found"));

    const host = mount(router);

    await router.navigate("/does-not-exist");
    expect(host.textContent).toContain("404 - not found");
  });

  test("a redirect goes straight to the destination", async () => {
    const router = new Router();
    router
      .redirect("/", "/login")
      .add("/login", () => div("login-page"));

    const host = mount(router);

    await router.navigate("/");
    expect(host.textContent).toContain("login-page");
    expect(router.path.val).toBe("/login");
  });

  test("beforeEnter redirects when there is no session (requireAuth)", async () => {
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

    // Without session → guard redirects to login
    await router.navigate("/private");
    expect(host.textContent).toContain("login-page");

    // With session → enters the private route
    await auth.login("a@b.com", "x");
    await router.navigate("/private");
    expect(host.textContent).toContain("private-area");
  });

  test("beforeEnter with false blocks navigation", async () => {
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

  test("global navigate() helper uses the active router", async () => {
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
  test("the global guard protects non-public routes and respects publicRoutes", async () => {
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

    // Declared public: the guard never even runs
    await router.navigate("/login");
    expect(host.textContent).toContain("login-page");
    expect(visited).toEqual([]);

    // Protected by default (declares nothing): the guard redirects to /login
    await router.navigate("/dashboard");
    expect(visited).toEqual(["/dashboard"]);
    expect(host.textContent).toContain("login-page");
    expect(host.textContent).not.toContain("dashboard-page");

    // Trailing wildcard: /docs/* covers /docs/guide
    await router.navigate("/docs/guide");
    expect(host.textContent).toContain("docs-page");
    expect(visited).toEqual(["/dashboard"]);

    // No wildcard covering it: also protected
    await router.navigate("/admin");
    expect(visited).toEqual(["/dashboard", "/admin"]);
    expect(host.textContent).toContain("login-page");
  });

  test("the global guard runs BEFORE the route's explicit beforeEnter", async () => {
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

  test("without guard in options the behavior is the usual one", async () => {
    const router = new Router();
    router.add("/open", () => div("open"));
    const host = mount(router);

    await router.navigate("/open");
    expect(host.textContent).toContain("open");
  });

  test("redirect replaces its history entry: back returns to the origin", async () => {
    const router = new Router();
    router
      .redirect("/", "/dashboard")
      .add("/dashboard", () => div("dashboard-page"))
      .add("/components", () => div("components-page"));
    const host = mount(router);

    await router.navigate("/components");
    const lenAtComponents = history.length;

    // Click on a link to "/" (alias): push "/" and the redirect replaces
    // that entry with "/dashboard" — a single push in total.
    await router.navigate("/");
    expect(router.path.val).toBe("/dashboard");
    expect(window.location.pathname).toBe("/dashboard");
    expect(history.length).toBe(lenAtComponents + 1);

    // BACK: returns to components (without the fix, "/" bounced back to /dashboard).
    history.back();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(router.path.val).toBe("/components");
    expect(host.textContent).toContain("components-page");
  });

  test("the guard's redirect also replaces: back returns to the origin without bouncing", async () => {
    // Breadcrumb scenario with a NOT authenticated user: "/" → alias to
    // /dashboard (protected) → the guard sends to /login. Both hops must
    // replace the entry so back returns to /components.
    const router = new Router({
      guard: () => "/login",
      publicRoutes: ["/login", "/components"],
    });
    router
      .redirect("/", "/dashboard")
      .add("/dashboard", () => div("dashboard-page"))
      .add("/components", () => div("components-page"))
      .add("/login", () => div("login-page"));
    const host = mount(router);
    // The history session is shared across tests: starting from /login
    // guarantees the next two navigations DO stack.
    await router.navigate("/login");
    await router.navigate("/components");
    const lenAtComponents = history.length;

    await router.navigate("/"); // protected alias: redirect + guard, 1 push total
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
