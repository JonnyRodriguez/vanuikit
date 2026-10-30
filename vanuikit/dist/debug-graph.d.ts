/**
 * debug-graph.ts — instrumentador de VanJS en modo desarrollo.
 *
 * Opciones-instala `van.state`/`van.derive` para construir el *árbol de
 * dependencias* real (qué derive lee qué estados) y detectar en el momento de
 * la violación las reglas silenciosas documentadas en AGENTS.md:
 *
 *  - R1 (state-in-derive):  `van.state()` creado DENTRO de un `van.derive`.
 *  - R2 (derive-writes-state): un derive escribe estados durante su cómputo
 *    (feedback; si además los leyó → ciclo).
 *  - R3 (derive-no-deps):   un derive sin lecturas (no es reactivo).
 *  - R4 (container-reactive-reads): una función de render lee estados reactivos
 *    (reconstruirá su subárbol; solo se reporta si pasó por `trackRender` o si
 *    la función fue marcada con `renderIntentional` → se suprime).
 *
 * Uso (dev-only):
 *
 *   import { van, installVanDebug } from "vanuikit";
 *   const debug = installVanDebug(van);
 *   // ... arrancar la app ...
 *   debug.printTree();   // grafo en consola
 *   debug.dump();        // grafo serializable
 *
 * En producción NO se importa ni se llama: el módulo no tiene efectos al
 * importarse (solo define funciones) y el bundle lo elimina por tree-shaking.
 */
import type { State } from "vanjs-core";
export type ViolationKind = "state-in-derive" | "derive-writes-state" | "derive-cycle" | "derive-no-deps" | "container-reactive-reads";
export interface VanDebugDiagnostic {
    kind: ViolationKind;
    message: string;
    origin?: string;
}
export interface VanDebugNode {
    id: number;
    label: string;
}
export interface VanDebugDerive extends VanDebugNode {
    deps: number[];
    writes: number[];
}
export interface VanDebugGraph {
    states: VanDebugNode[];
    derives: VanDebugDerive[];
    diagnostics: VanDebugDiagnostic[];
}
export interface VanDebugApi {
    /** Devuelve el grafo serializable actual. */
    dump(): VanDebugGraph;
    /** Imprime el grafo en consola (árbol derive → estados). */
    printTree(): void;
    /** Diagnósticos acumulados. */
    diagnostics(): readonly VanDebugDiagnostic[];
    /** Limpia estados, derives y diagnósticos (para tests). */
    clear(): void;
    /**
     * Ejecuta `fn` bajo un marco de tipo "render" (función contenedora).
     * Si `fn` lee estados reactivos, reporta R4. Útil para verificar
     * contenedores sospechosos durante el desarrollo.
     */
    trackRender<T>(fn: () => T, label?: string): T;
    /**
     * Marca una función render como intencionalmente reactiva: si se pasa por
     * `trackRender`, la lectura de estados NO se reporta (rebuild a propósito).
     */
    renderIntentional<T extends (...args: never[]) => unknown>(fn: T): T;
    /** silence: true → no imprime warnings (solo acumula). */
    configure(opts: {
        silent?: boolean;
    }): void;
}
interface VanLike {
    state(initVal?: unknown, label?: string): State<unknown>;
    derive<T>(fn: () => T): State<T>;
}
declare function installVanDebug(van: VanLike): VanDebugApi;
export { installVanDebug };
//# sourceMappingURL=debug-graph.d.ts.map