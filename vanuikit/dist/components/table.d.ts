import { type State, type ChildDom } from "vanjs-core";
export interface TableColumn<T = any> {
    key: string;
    header: string | State<string>;
    render?: (row: T, index: number) => ChildDom;
    sortable?: boolean;
    align?: "left" | "center" | "right";
    width?: string;
    compare?: (a: T, b: T) => number;
}
export interface TableProps<T = any> {
    id?: string;
    columns: TableColumn<T>[];
    data: T[] | State<T[]>;
    keyField?: string;
    emptyText?: string | State<string>;
    pageSize?: number;
    searchable?: boolean;
    searchPlaceholder?: string | State<string>;
    selectable?: boolean;
    selectedRows?: State<T[]>;
    onSelectionChange?: (selected: T[]) => void;
    class?: string;
}
export declare function Table<T extends Record<string, any> = any>(props: TableProps<T>): HTMLDivElement;
/**
 * DataGrid — Alias semántico con configuración avanzada para tablas de datos completas.
 */
export declare const DataGrid: typeof Table;
//# sourceMappingURL=table.d.ts.map