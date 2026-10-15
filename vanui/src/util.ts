/**
 * Utilidades compartidas de la librería.
 */

/** Une clases descartando valores vacíos: cx("a", null, "b") -> "a b" */
export const cx = (...parts: Array<string | null | undefined | false>) =>
  parts.filter(Boolean).join(" ").trim();

/** ¿La ruta actual corresponde al href? Coincidencia exacta o por subruta (`href/...`); "/" solo coincide consigo misma. */
export const isRouteActive = (current: string, href: string): boolean =>
  href === "/" ? current === "/" : current === href || current.startsWith(`${href}/`);
