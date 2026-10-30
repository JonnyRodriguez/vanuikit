import { type ChildDom, type State } from "vanjs-core";
/**
 * Loguea cada cambio del State (valor inicial incluido) y lo devuelve para
 * encadenar. Herramienta de desarrollo: en producción conviene retirarla
 * (o silenciar console en el build).
 *
 *   const count = trace(van.state(0), "count");
 *
 * Cuidado: como `t()`, cada `trace` agrega un listener permanente — no lo
 * llames dentro de bindings que se re-ejecutan.
 */
export declare const trace: <T>(state: State<T>, name?: string) => State<T>;
export interface ExpectReactiveOptions {
    /** Construye el árbol a probar (se monta en un host temporal). */
    render: () => ChildDom;
    /** Muta los estados bajo prueba. */
    act: () => void;
    /** Texto exacto esperado en el árbol tras `act()` (textContent). */
    text?: string;
    /** Subcadena esperada tras `act()`. */
    contains?: string;
    /** Espera custom (default: un microtask, el ciclo de bindings de van). */
    tick?: () => Promise<void>;
}
/**
 * Detector de bindings congelados para suites de test (agnóstico del
 * runner: lanza Error en vez de usar expect). Renderiza, captura el texto,
 * ejecuta `act()` y verifica que el árbol mutó al texto esperado.
 *
 *   await expectReactive({
 *     render: () => span(miState),
 *     act: () => (miState.val = "nuevo"),
 *     contains: "nuevo",
 *   });
 */
export declare const expectReactive: (opts: ExpectReactiveOptions) => Promise<void>;
//# sourceMappingURL=debug.d.ts.map