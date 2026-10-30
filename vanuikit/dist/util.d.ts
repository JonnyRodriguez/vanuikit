/**
 * Utilidades compartidas de la librería.
 */
/** Une clases descartando valores vacíos: cx("a", null, "b") -> "a b" */
export declare const cx: (...parts: Array<string | null | undefined | false>) => string;
/** ¿La ruta actual corresponde al href? Coincidencia exacta o por subruta (`href/...`); "/" solo coincide consigo misma. */
export declare const isRouteActive: (current: string, href: string) => boolean;
//# sourceMappingURL=util.d.ts.map