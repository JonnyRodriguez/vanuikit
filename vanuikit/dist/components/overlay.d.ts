import { type State } from "vanjs-core";
/**
 * Bloquea el scroll del body mientras `open` esté en true. Con contador para
 * overlays apilados: solo se libera cuando el último overlay cierra.
 * El derive vive mientras viva el árbol del componente.
 */
export declare const useScrollLock: (open: State<boolean>) => void;
/** Detecta dispositivos sin hover (touch): los tooltips no se abren ahí. */
export declare const isCoarsePointer: () => boolean;
//# sourceMappingURL=overlay.d.ts.map