/**
 * Utilidades compartidas de la librería.
 */

/** Une clases descartando valores vacíos: cx("a", null, "b") -> "a b" */
export const cx = (...parts: Array<string | null | undefined | false>) =>
  parts.filter(Boolean).join(" ").trim();
