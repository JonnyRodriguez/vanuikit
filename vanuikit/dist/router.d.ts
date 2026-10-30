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
export type Guard = (ctx: RouteContext) => boolean | string | void | Promise<boolean | string | void>;
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
export declare class Router {
    private routes;
    private redirects;
    private notFound;
    private defaultGuard?;
    private publicRoutes;
    /** Nodo reactivo de la vista actual — monta con `van.add(root, router.current)` o vía `start()`. */
    current: import("vanjs-core").State<Node>;
    /** Ruta actual (reactiva) — el Nav la lee para resaltar el link activo. */
    path: import("vanjs-core").State<string>;
    constructor(options?: RouterOptions);
    /** ¿`pathname` es pública según `publicRoutes`? (exacto, wildcard "/x/*" o RegExp) */
    private isPublic;
    /** Registra una ruta. `path` acepta segmentos `:param`. */
    add(path: string, factory: RouteFactory, options?: RouteOptions): this;
    /** Registra una redirección: al navegar a `from` va directo a `to`. */
    redirect(from: string, to: string): this;
    /** Factory para rutas sin match. */
    setNotFound(factory: RouteFactory): this;
    /** Navega a `path` (pushState o replaceState) y resuelve. Devuelve la resolución (para tests). */
    navigate(path: string, options?: {
        replace?: boolean;
    }): Promise<void>;
    /** Re-resuelve la ruta actual (útil en tests y tras cambios de estado). */
    resolve(): void;
    /**
     * Navegación "de sistema" — LA única puerta para redirects. La ruta de
     * origen nunca llegó a renderizarse (alias de `.redirect()`, verdict de
     * un guard), así que REEMPLAZA su entrada del historial en vez de apilar:
     * solo la navegación iniciada por el usuario (Link, spaClick, navigate)
     * apila. Cualquier redirect futuro del router debe pasar por aquí — nunca
     * llamar `navigate(target, { replace: true })` a mano.
     */
    private systemRedirect;
    /** Busca la ruta que matchea `pathname` y la renderiza (aplica guard/redirect/notFound). */
    private doResolve;
    /**
     * Instala listeners (popstate + intercepción de clicks en `<a>` internos)
     * y resuelve la ruta inicial. Devuelve un binding para montar con `van.add`.
     *
     * Los listeners son globales y únicos: delegan al router activo, así que
     * llamar `start()` en varias instancias (HMR, tests) no acumula handlers
     * que compitan por la misma navegación.
     */
    start(): () => Node;
}
export declare function setActiveRouter(router: Router | null): void;
export declare function getActiveRouter(): Router | null;
/**
 * Función global de navegación.
 * Utiliza el router activo actual para navegar sin necesidad de inyectar dependencias.
 */
export declare function navigate(path: string, options?: {
    replace?: boolean;
}): Promise<void>;
/**
 * Interceptor de clicks para anclas SPA (Link/Nav/SidebarItem). El onclick del
 * consumidor corre primero; se navega solo si nadie hizo preventDefault, el
 * enlace es interno y el usuario no pidió manejarlo por su cuenta
 * (modificadores Ctrl/Cmd/Shift/Alt o target propio).
 */
export declare function spaClick(e: MouseEvent, href: string, options?: {
    replace?: boolean;
    external?: boolean;
    target?: string;
}): void;
/** Factory para crear una instancia de Router */
export declare function createRouter(options?: RouterOptions): Router;
//# sourceMappingURL=router.d.ts.map