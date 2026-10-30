import { type ChildDom } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export interface EmptyStateOptions {
    /** Ícono decorativo (ChildDom); default Icon "inbox". */
    icon?: ChildDom;
    title: ToggleText;
    description?: ToggleText;
    /** Slot de acción (p. ej. un Button que abre el flujo de creación). */
    action?: ChildDom;
    class?: string;
    [key: string]: any;
}
/**
 * Estado vacío de una vista o sección: ícono, título, descripción y acción
 * principal. El texto siempre lo aporta el consumidor con `t()`; el
 * componente solo aporta la maquetación.
 */
export declare const EmptyState: (props: EmptyStateOptions) => HTMLDivElement;
//# sourceMappingURL=empty-state.d.ts.map