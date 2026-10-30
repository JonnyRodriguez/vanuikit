import { type ChildDom, type State } from "vanjs-core";
export type DrawerSide = "left" | "right" | "top" | "bottom";
export interface DrawerOptions {
    /** Estado controlado por el consumidor: true = abierto. */
    open: State<boolean>;
    side?: DrawerSide;
    /** Esc y click en el backdrop cierran (default true). */
    dismissible?: boolean;
    onClose?: () => void;
    /** Botón × en la esquina (default true; usa la llave modal.close). */
    showClose?: boolean;
    /** Clases extra del panel (p. ej. w-96 para ensancharlo). */
    class?: string;
    [key: string]: any;
}
/**
 * Panel deslizante por lado (generaliza el patrón responsive del sidebar):
 * backdrop con transición, Esc, bloqueo de scroll del body, foco que entra
 * al panel (con trampa de Tab) y vuelve al elemento que lo abrió. El panel
 * permanece montado (traducido fuera de pantalla) para conservar bindings.
 */
export declare const Drawer: (props: DrawerOptions, ...content: ChildDom[]) => ChildDom;
//# sourceMappingURL=drawer.d.ts.map