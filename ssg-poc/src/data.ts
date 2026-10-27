// ssg-poc/src/data.ts
/**
 * Seeds: los datos que el SSG resolvió en build y el cliente consume ANTES
 * del primer render.
 *
 * Flujo:
 *   · Build: la página hace createQuery → el fetch lo resuelve el mock
 *     (scripts/api-mock.ts) → lo servido queda registrado → el SSG lo
 *     embebe como <script type="application/json" id="ssg-data">.
 *   · Cliente: loadPayload() parsea ese script ANTES de boot(); las páginas
 *     hacen q.setData(getSeed(path)) → el primer render YA tiene datos y el
 *     remount produce exactamente el mismo DOM que el HTML estático (sin
 *     flash de skeleton).
 *
 * La clave del seed es la ruta de la API (p. ej. "/api/products"), igual a
 * la que la página le pasa a createQuery.
 */
let seeds = new Map<string, unknown>();

/** Reemplaza el mapa de seeds (usado por el cliente tras parsear el payload). */
export const pushPayload = (data: Record<string, unknown>) => {
  seeds = new Map(Object.entries(data));
};

/** Lee el payload JSON que el SSG embebió en la página (no-op fuera del SSG). */
export const loadPayload = (): boolean => {
  const el = document.getElementById("ssg-data");
  if (!el?.textContent) return false;
  try {
    const parsed = JSON.parse(el.textContent) as { data?: Record<string, unknown> };
    pushPayload(parsed.data ?? {});
    return true;
  } catch {
    return false;
  }
};

/** Seed por ruta de API (la misma que recibe createQuery). */
export const getSeed = <T>(path: string): T | undefined => seeds.get(path) as T | undefined;

/** Limpia seeds (tests). */
export const resetSeeds = () => {
  seeds = new Map();
};
