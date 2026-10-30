import { type ChildDom, type State } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export interface PaginationOptions {
    /** Página actual (1-based); acepta State externo para enlace bidireccional. */
    page: number | State<number>;
    /** Total de páginas; admite State (listas que crecen/encogen). */
    totalPages: number | State<number>;
    /** Páginas vecinas visibles alrededor de la actual (default 1). */
    siblingCount?: number;
    ariaLabel?: ToggleText;
    class?: string;
    [key: string]: any;
}
type Slot = number | "ellipsis-l" | "ellipsis-r";
/**
 * Rango de páginas con ellipsis: 1 y última siempre visibles, `siblingCount`
 * vecinas alrededor de la actual y "…" donde se recorta.
 */
export declare const pageSlots: (page: number, totalPages: number, siblingCount: number) => Slot[];
/**
 * Paginación numerada standalone (la del DataGrid es la versión simple
 * prev/"x / y"/next): `<nav>` con botones, `aria-current="page"` en la
 * actual, prev/next deshabilitados en los extremos y `page` bidireccional.
 */
export declare const Pagination: (props: PaginationOptions) => ChildDom;
export {};
//# sourceMappingURL=pagination.d.ts.map