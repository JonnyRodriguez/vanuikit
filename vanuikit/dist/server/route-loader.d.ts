import { Hono, type MiddlewareHandler } from "hono";
/** Meta opcional que un archivo de ruta puede exportar junto al sub-app. */
export type RouteMeta = {
    /**
     * Marca el archivo como público (sin el guard de autenticación).
     * Por defecto, con `auth` configurado, TODO es protegido.
     */
    public?: boolean;
};
/** Info de una ruta cargada (para el callback `onLoad`). */
export type LoadedRouteInfo = {
    /** Ruta montada, p. ej. "/api/auth". */
    path: string;
    /** Archivo relativo a routesDir, p. ej. "api/auth.route.ts". */
    file: string;
    /** `true` si el guard de `options.auth` quedó aplicado. */
    protected: boolean;
};
export type LoadRoutesOptions = {
    /**
     * Middleware de autenticación (p. ej. `requireAuth()`). Si se pasa, todas
     * las rutas quedan protegidas salvo las que exporten `meta = { public: true }`.
     */
    auth?: MiddlewareHandler;
    /**
     * Callback opcional por ruta cargada. La librería no loguea sola: la app
     * decide (p. ej. `onLoad: (i) => console.log(i.path, i.file, i.protected)`).
     */
    onLoad?: (info: LoadedRouteInfo) => void;
};
export declare function loadRoutes(routesDir: string, options?: LoadRoutesOptions): Promise<Hono>;
//# sourceMappingURL=route-loader.d.ts.map