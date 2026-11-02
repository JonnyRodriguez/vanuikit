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
    // Mensaje en inglés: mensaje de consola para consumidores del paquete en npm.
    console.error(
      [
        "[vanuikit] TWO copies of vanjs-core detected in this bundle: reactivity silently breaks.",
        "  Symptoms: views don't update on navigation, frozen text, components going empty or duplicated.",
        '  1) Always import van from "vanuikit" (import { van } from "vanuikit"); never import "vanjs-core" directly.',
        "  2) Keep a single physical copy: align vanjs-core versions across your tree and dedupe it in your bundler.",
      ].join("\n"),
    );
    return;
  }
  g[INSTANCE_KEY] = van;
}
