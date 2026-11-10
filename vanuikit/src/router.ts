/**
 * Router — SPA navigation base of the library.
 *
 * Pattern from the demo/store routers (web/src/router.ts), but as part of
 * vanuikit's dev base: supports params (`/product/:id`), per-route guards
 * (`beforeEnter`) and redirects. Dependency-free: the route matcher is
 * hand-written (~20 lines), no path-to-regexp.
 *
 * Usage:
 *   const router = new Router();
 *   router.add("/product/:id", ({ params }) => ProductScreen(params));
 *   router.add("/login", () => LoginScreen());
 *   router.add("/dashboard", () => Dashboard(), {
 *     beforeEnter: requireAuth(auth, "/login"),
 *   });
 *   router.redirect("/", "/login");
 *   router.setNotFound(() => NotFound());
 *   // mount: const view = router.start(); van.add(root, view);
 *
 * `current` is a re-exportable van.State for mounting the view; `path`
 * is the reactive current route (Nav reads it).
 */
import van from "vanjs-core";
import { t } from "./i18n.js";

const { div } = van.tags;

/** Params extracted from the URL, e.g. `/product/:id` → `{ id: "42" }`. */
export type RouteParams = Record<string, string>;

/** Context available to a route's factories and guards. */
export type RouteContext = {
  /** Route being navigated to (full pathname). */
  to: string;
  /** Route params if the path has `:param` segments. */
  params: RouteParams;
  /** Navigate to another route (useful inside guards). */
  navigate: (path: string) => void;
};

/**
 * Route guard: evaluated BEFORE rendering.
 * Returns:
 *  - `false`        → blocks navigation (view does not change)
 *  - a `string`     → redirects to that route
 *  - `true`/nothing → allows entry
 */
export type Guard = (
  ctx: RouteContext,
) => boolean | string | void | Promise<boolean | string | void>;

/** Per-route options. */
export type RouteOptions = {
  beforeEnter?: Guard;
  afterEnter?: (ctx: RouteContext) => void;
};

/** Router options (deny-by-default access policy). */
export type RouterOptions = {
  /**
   * Default guard (e.g. `requireAuth(auth, "/login")`). If provided, EVERY
   * route is protected unless it matches `publicRoutes` — the developer
   * declares what is public and never forgets what is protected.
   */
  guard?: Guard;
  /**
   * Public routes when `guard` is set: exact (`"/login"`), with trailing
   * wildcard (`"/docs/*"` covers `/docs/` and anything after) or RegExp.
   */
  publicRoutes?: (string | RegExp)[];
};

/** Component factory: returns a reactive DOM node (receives the context). */
export type RouteFactory = (ctx: RouteContext) => Node;

type CompiledRoute = {
  path: string;
  regex: RegExp;
  keys: string[];
  factory: RouteFactory;
  beforeEnter?: Guard;
  afterEnter?: (ctx: RouteContext) => void;
};

/** Compiles `/product/:id` → RegExp + param keys (dependency-free). */
function compile(path: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = [];
  const source = path
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) {
        keys.push(seg.slice(1));
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { regex: new RegExp(`^${source}/?$`), keys };
}

export class Router {
  private routes: CompiledRoute[] = [];
  private redirects = new Map<string, string>();
  private notFound: RouteFactory = () => div(t("router.notFound", "404 - Not found"));
  private defaultGuard?: Guard;
  private publicRoutes: (string | RegExp)[];

  /** Reactive node of the current view — mount with `van.add(root, router.current)` or via `start()`. */
  current = van.state<Node>(div(t("router.loading", "Loading...")));

  /** Current route (reactive) — Nav reads it to highlight the active link. */
  path = van.state<string>("/");

  constructor(options: RouterOptions = {}) {
    this.defaultGuard = options.guard;
    this.publicRoutes = options.publicRoutes ?? [];
    // If there is no main active router yet, register ourselves as the default active one
    if (!activeRouter) {
      activeRouter = this;
    }
  }

  /** Is `pathname` public according to `publicRoutes`? (exact, wildcard "/x/*" or RegExp) */
  private isPublic(pathname: string): boolean {
    return this.publicRoutes.some((p) => {
      if (p instanceof RegExp) return p.test(pathname);
      if (p.endsWith("/*")) return pathname === p.slice(0, -2) || pathname.startsWith(p.slice(0, -1));
      return p === pathname;
    });
  }

  /** Registers a route. `path` accepts `:param` segments. */
  add(path: string, factory: RouteFactory, options: RouteOptions = {}) {
    this.routes.push({ path, ...compile(path), factory, ...options });
    return this;
  }

  /** Registers a redirect: navigating to `from` goes straight to `to`. */
  redirect(from: string, to: string) {
    this.redirects.set(from, to);
    return this;
  }

  /** Factory for unmatched routes. */
  setNotFound(factory: RouteFactory) {
    this.notFound = factory;
    return this;
  }

  /** Navigates to `path` (pushState or replaceState) and resolves. Returns the resolution (for tests). */
  async navigate(path: string, options?: { replace?: boolean }) {
    if (path === (window.location.pathname || "/")) return;
    if (options?.replace) {
      window.history.replaceState({}, "", path);
    } else {
      window.history.pushState({}, "", path);
    }
    await this.doResolve();
  }

  /** Re-resolves the current route (useful in tests and after state changes). */
  resolve() {
    void this.doResolve();
  }

  /**
   * "System" navigation — THE single entry point for redirects. The origin route
   * never got to render (alias of `.redirect()`, verdict of a guard), so it
   * REPLACES its history entry instead of stacking: only user-initiated
   * navigation (Link, spaClick, navigate) stacks. Any future router redirect
   * must go through here — never call `navigate(target, { replace: true })`
   * by hand.
   */
  private async systemRedirect(target: string): Promise<void> {
    await this.navigate(target, { replace: true });
  }

  /** Finds the route matching `pathname` and renders it (applies guard/redirect/notFound). */
  private async doResolve(href?: string) {
    const to = href ?? (window.location.pathname || "/");

    const redirectTo = this.redirects.get(to);
    if (redirectTo) {
      await this.systemRedirect(redirectTo);
      return;
    }

    this.path.val = to;

    for (const route of this.routes) {
      const m = to.match(route.regex);
      if (!m) continue;

      const params: RouteParams = {};
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(m[i + 1]);
      });

      const ctx: RouteContext = {
        to,
        params,
        navigate: (p) => void this.navigate(p),
      };

      // Deny-by-default: global guard (if any) for every non-public route,
      // then the route's explicit beforeEnter, in that order.
      const guards: Guard[] = [];
      if (this.defaultGuard && !this.isPublic(to)) guards.push(this.defaultGuard);
      if (route.beforeEnter) guards.push(route.beforeEnter);
      for (const guard of guards) {
        const verdict = await guard(ctx);
        if (typeof verdict === "string" && verdict !== to) {
          await this.systemRedirect(verdict);
          return;
        }
        if (verdict === false) return;
      }

      this.current.val = route.factory(ctx);
      route.afterEnter?.(ctx);
      return;
    }

    this.current.val = this.notFound({ to, params: {}, navigate: (p) => void this.navigate(p) });
  }

  /**
   * Installs listeners (popstate + click interception on internal `<a>`)
   * and resolves the initial route. Returns a binding to mount with `van.add`.
   *
   * The listeners are global and unique: they delegate to the active router,
   * so calling `start()` on several instances (HMR, tests) does not
   * accumulate handlers competing for the same navigation.
   */
  start() {
    activeRouter = this;

    if (!popstateHandler) {
      popstateHandler = () => activeRouter?.resolve();
      window.addEventListener("popstate", popstateHandler);
    }

    if (!clickHandler) {
      // Fallback for anchors vanuikit does not manage (no Link/Nav): same
      // contract as spaClick — respects the element's preventDefault, the
      // user's modifiers (Ctrl/Cmd opens in a new tab) and target.
      clickHandler = (e) => {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!(e.target instanceof Element)) return;
        const target = (e.target as HTMLElement).closest("a");
        if (
          target &&
          !target.hasAttribute("target") &&
          target.origin === window.location.origin &&
          !target.hasAttribute("data-native")
        ) {
          e.preventDefault();
          void activeRouter?.navigate(target.pathname);
        }
      };
      document.addEventListener("click", clickHandler);
    }

    this.resolve();
    return () => this.current.val;
  }
}

/** popstate listener shared by every `start()` (delegates to the active router). */
let popstateHandler: (() => void) | null = null;

/** Click listener shared by every `start()` (delegates to the active router). */
let clickHandler: ((e: MouseEvent) => void) | null = null;

/** Active instance of the main router for global navigation */
let activeRouter: Router | null = null;

export function setActiveRouter(router: Router | null) {
  activeRouter = router;
}

export function getActiveRouter(): Router | null {
  return activeRouter;
}

/**
 * Global navigation function.
 * Uses the current active router to navigate without needing dependency injection.
 */
export async function navigate(path: string, options?: { replace?: boolean }) {
  if (activeRouter) {
    await activeRouter.navigate(path, options);
  } else {
    if (options?.replace) {
      window.history.replaceState({}, "", path);
    } else {
      window.history.pushState({}, "", path);
    }
  }
}

/**
 * Click interceptor for SPA anchors (Link/Nav/SidebarItem). The consumer's
 * onclick runs first; navigation happens only if nobody called
 * preventDefault, the link is internal and the user did not ask to handle
 * it themselves (Ctrl/Cmd/Shift/Alt modifiers or their own target).
 */
export function spaClick(
  e: MouseEvent,
  href: string,
  options: { replace?: boolean; external?: boolean; target?: string } = {},
): void {
  if (
    e.defaultPrevented ||
    options.external ||
    options.target ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  ) {
    return;
  }
  e.preventDefault();
  void navigate(href, { replace: options.replace });
}

/** Factory to create a Router instance */
export function createRouter(options: RouterOptions = {}): Router {
  const router = new Router(options);
  activeRouter = router;
  return router;
}