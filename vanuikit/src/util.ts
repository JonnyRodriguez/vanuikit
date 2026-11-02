/**
 * Shared library utilities.
 */

/** Joins classes discarding empty values: cx("a", null, "b") -> "a b" */
export const cx = (...parts: Array<string | null | undefined | false>) =>
  parts.filter(Boolean).join(" ").trim();

/** Does the current route match the href? Exact match or by subroute (`href/...`); "/" only matches itself. */
export const isRouteActive = (current: string, href: string): boolean =>
  href === "/" ? current === "/" : current === href || current.startsWith(`${href}/`);
