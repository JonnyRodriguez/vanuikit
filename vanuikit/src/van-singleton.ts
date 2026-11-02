/**
 * Detector runtime de la regla de instancia única de VanJS.
 *
 * Dos copias de vanjs-core en el mismo bundle son dos sistemas de estado que
 * no se hablan: la reactividad se rompe en silencio (la vista del router no
 * cambia al navegar, bindings congelados, componentes que desaparecen). La
 * documentación no alcanza — este guard convierte el error en un mensaje de
 * consola inmediato con la solución exacta.
 *
 * `Symbol.for` (no `Symbol`): el registro global lo comparten TODAS las
 * copias del módulo, aunque cada una viva en un archivo distinto del bundle
 * — así se delata la segunda copia al evaluarse.
 */
const INSTANCE_KEY = Symbol.for("vanuikit.vanjs-core.instance");

/** Registra la instancia de van y avisa (console.error) si ya había otra. */
export function guardSingleVan(van: unknown): void {
  const g = globalThis as unknown as Record<symbol, unknown>;
  const prev = g[INSTANCE_KEY];
  if (prev !== undefined && prev !== van) {
    // No sobreescribe la marca: la copia real queda registrada.
    console.error(
      [
        "[vanuikit] DOS copias de vanjs-core en este bundle: la reactividad se rompe en silencio.",
        "  Síntomas: la vista no cambia al navegar, textos congelados, componentes vacíos o duplicados.",
        '  1) Importa van siempre desde "vanuikit" (import { van } from "vanuikit"); nunca importes "vanjs-core" directo.',
        "  2) Deja una sola copia física: alinea las versiones de vanjs-core y dedupéalo en el bundler (ver AGENTS.md §5).",
      ].join("\n"),
    );
    return;
  }
  g[INSTANCE_KEY] = van;
}
