/**
 * Router — base de navegación SPA de la librería.
 *
 * Patrón de los routers de demo/store (web/src/router.ts), pero como parte
 * de la base de desarrollo de vanui: soporta params (`/product/:id`),
 * guards por ruta (`beforeEnter`) y redirecciones. Sin dependencias: el
 * matcher de rutas está escrito a mano (~20 líneas), sin path-to-regexp.
 *
 * Uso:
 *   const router = new Router();
 *   router.add("/product/:id", ({ params }) => ProductScreen(params));
 *   router.add("/login", () => LoginScreen());
 *   router.add("/dashboard", () => Dashboard(), {
 *     beforeEnter: requireAuth(auth, "/login"),
 *   });
 *   router.redirect("/", "/login");
 *   router.setNotFound(() => NotFound());
 *   // montar: const view = router.start(); van.add(root, view);
 *
 * El `current` es un van.State re-exportable para montar la vista; `path`
 * es la ruta actual reactiva (para el Nav).
 */
import van from "vanjs-core";

const { div } = van.tags;

/** Params extraídos de la URL, p. ej. `/product/:id` → `{ id: "42" }`. */
export type RouteParams = Record<string, string>;

/** Contexto disponible para factories y guards de una ruta. */
export type RouteContext = {
  /** Ruta a la que se está navegando (pathname completo). */
  to: string;
  /** Params de la ruta si el path tiene segmentos `:param`. */
  params: RouteParams;
  /** Navega a otra ruta (útil dentro de guards). */
  navigate: (path: string) => void;
};

/**
 * Guard de ruta: se evalúa ANTES de renderizar.
 * Devuelve:
 *  - `false`        → bloquea la navegación (no cambia la vista)
 *  - una `string`   → redirige a esa ruta
 *  - `true`/nada    → permite entrar
 */
export type Guard = (
  ctx: RouteContext,
) => boolean | string | void | Promise<boolean | string | void>;

/** Opciones por ruta. */
export type RouteOptions = {
  beforeEnter?: Guard;
  afterEnter?: (ctx: RouteContext) => void;
};

/** Opciones del Router (política de acceso deny-by-default). */
export type RouterOptions = {
  /**
   * Guard por defecto (p. ej. `requireAuth(auth, "/login")`). Si se pasa,
   * TODA ruta queda protegida salvo las que matcheen `publicRoutes` — el
   * programador declara lo público y nunca olvida lo protegido.
   */
  guard?: Guard;
  /**
   * Rutas públicas cuando hay `guard`: exactas (`"/login"`), con wildcard
   * de cola (`"/docs/*"` cubre `/docs/` y lo que siga) o RegExp.
   */
  publicRoutes?: (string | RegExp)[];
};

/** Factory de componente: devuelve un nodo DOM reactivo (recibe el contexto). */
export type RouteFactory = (ctx: RouteContext) => Node;

type CompiledRoute = {
  path: string;
  regex: RegExp;
  keys: string[];
  factory: RouteFactory;
  beforeEnter?: Guard;
  afterEnter?: (ctx: RouteContext) => void;
};

/** Compila `/product/:id` → RegExp + claves de params (sin dependencias). */
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
  private notFound: RouteFactory = () => div("404 - No encontrado");
  private defaultGuard?: Guard;
  private publicRoutes: (string | RegExp)[];

  /** Nodo reactivo de la vista actual — monta con `van.add(root, router.current)` o vía `start()`. */
  current = van.state<Node>(div("Cargando..."));

  /** Ruta actual (reactiva) — el Nav la lee para resaltar el link activo. */
  path = van.state<string>("/");

  constructor(options: RouterOptions = {}) {
    this.defaultGuard = options.guard;
    this.publicRoutes = options.publicRoutes ?? [];
    // Si no hay un router activo principal, nos registramos como el activo por defecto
    if (!activeRouter) {
      activeRouter = this;
    }
  }

  /** ¿`pathname` es pública según `publicRoutes`? (exacto, wildcard "/x/*" o RegExp) */
  private isPublic(pathname: string): boolean {
    return this.publicRoutes.some((p) => {
      if (p instanceof RegExp) return p.test(pathname);
      if (p.endsWith("/*")) return pathname === p.slice(0, -2) || pathname.startsWith(p.slice(0, -1));
      return p === pathname;
    });
  }

  /** Registra una ruta. `path` acepta segmentos `:param`. */
  add(path: string, factory: RouteFactory, options: RouteOptions = {}) {
    this.routes.push({ path, ...compile(path), factory, ...options });
    return this;
  }

  /** Registra una redirección: al navegar a `from` va directo a `to`. */
  redirect(from: string, to: string) {
    this.redirects.set(from, to);
    return this;
  }

  /** Factory para rutas sin match. */
  setNotFound(factory: RouteFactory) {
    this.notFound = factory;
    return this;
  }

  /** Navega a `path` (pushState o replaceState) y resuelve. Devuelve la resolución (para tests). */
  async navigate(path: string, options?: { replace?: boolean }) {
    if (path === (window.location.pathname || "/")) return;
    if (options?.replace) {
      window.history.replaceState({}, "", path);
    } else {
      window.history.pushState({}, "", path);
    }
    await this.doResolve();
  }

  /** Re-resuelve la ruta actual (útil en tests y tras cambios de estado). */
  resolve() {
    void this.doResolve();
  }

  /** Busca la ruta que matchea `pathname` y la renderiza (aplica guard/redirect/notFound). */
  private async doResolve(href?: string) {
    const to = href ?? (window.location.pathname || "/");

    const redirectTo = this.redirects.get(to);
    if (redirectTo) {
      await this.navigate(redirectTo);
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

      // Deny-by-default: guard global (si hay) para toda ruta no pública,
      // y después el beforeEnter explícito de la ruta, en ese orden.
      const guards: Guard[] = [];
      if (this.defaultGuard && !this.isPublic(to)) guards.push(this.defaultGuard);
      if (route.beforeEnter) guards.push(route.beforeEnter);
      for (const guard of guards) {
        const verdict = await guard(ctx);
        if (typeof verdict === "string" && verdict !== to) {
          await this.navigate(verdict);
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
   * Instala listeners (popstate + intercepción de clicks en `<a>` internos)
   * y resuelve la ruta inicial. Devuelve un binding para montar con `van.add`.
   *
   * Los listeners son globales y únicos: delegan al router activo, así que
   * llamar `start()` en varias instancias (HMR, tests) no acumula handlers
   * que compitan por la misma navegación.
   */
  start() {
    activeRouter = this;

    if (!popstateHandler) {
      popstateHandler = () => activeRouter?.resolve();
      window.addEventListener("popstate", popstateHandler);
    }

    if (!clickHandler) {
      clickHandler = (e) => {
        const target = (e.target as HTMLElement).closest("a");
        if (
          target &&
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

/** Listener popstate compartido por todos los `start()` (delega al router activo). */
let popstateHandler: (() => void) | null = null;

/** Listener de click compartido por todos los `start()` (delega al router activo). */
let clickHandler: ((e: MouseEvent) => void) | null = null;

/** Instancia activa del router principal para navegación global */
let activeRouter: Router | null = null;

export function setActiveRouter(router: Router | null) {
  activeRouter = router;
}

export function getActiveRouter(): Router | null {
  return activeRouter;
}

/**
 * Función global de navegación.
 * Utiliza el router activo actual para navegar sin necesidad de inyectar dependencias.
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

/** Factory para crear una instancia de Router */
export function createRouter(options: RouterOptions = {}): Router {
  const router = new Router(options);
  activeRouter = router;
  return router;
}