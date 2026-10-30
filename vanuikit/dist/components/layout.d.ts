import { type State } from "vanjs-core";
/** Contrato de llaves de i18n del componente */
export declare const TEXTS: {
    readonly collapse: {
        readonly key: "sidebar.collapse";
        readonly default: "Colapsar barra lateral";
    };
    readonly expand: {
        readonly key: "sidebar.expand";
        readonly default: "Expandir barra lateral";
    };
    readonly close: {
        readonly key: "sidebar.close";
        readonly default: "Cerrar menú";
    };
    readonly title: {
        readonly key: "sidebar.title";
        readonly default: "Sidebar";
    };
    readonly resize: {
        readonly key: "sidebar.resize";
        readonly default: "Ajustar ancho de la barra lateral";
    };
};
export type SidebarItemProps = {
    href?: string;
    label: string | State<string> | (() => string | Node);
    icon?: string | Node | (() => Node);
    badge?: string | number | State<string | number> | Node;
    badgeVariant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
    active?: boolean | State<boolean> | (() => boolean);
    current?: string | State<string>;
    onclick?: (e: MouseEvent) => void;
    class?: string;
};
export declare function SidebarItem(props: SidebarItemProps): () => HTMLAnchorElement | HTMLButtonElement;
export type SidebarGroupProps = {
    title?: string | State<string> | (() => string);
    class?: string;
};
export declare function SidebarGroup(props: SidebarGroupProps, ...children: (Node | (() => Node | null | undefined) | null | undefined)[]): HTMLDivElement;
export type SidebarProps = {
    header?: Node | string | (() => Node);
    content?: Node | (Node | HTMLElement | (() => Node | null | undefined) | null | undefined)[] | (() => Node);
    footer?: Node | string | (() => Node);
    isOpen?: State<boolean>;
    onClose?: () => void;
    /** Muestra el botón de colapso en desktop (ancho completo ↔ rail de iconos). */
    collapsible?: boolean;
    /** Estado controlado del colapso. Si se omite y `collapsible`, se gestiona internamente. */
    collapsed?: State<boolean>;
    /** Clave de localStorage para persistir el colapso no controlado (por defecto "vanuikit-sidebar-collapsed"). */
    storageKey?: string;
    /** Permite redimensionar el ancho arrastrando el borde derecho (solo desktop). */
    resizable?: boolean;
    /** Ancho inicial en px cuando resizable (por defecto 256). */
    defaultWidth?: number;
    /** Ancho mínimo en px (por defecto 224). */
    minWidth?: number;
    /** Ancho máximo en px (por defecto 384). */
    maxWidth?: number;
    /** Clave de localStorage para persistir el ancho (por defecto "vanuikit-sidebar-width"). */
    widthStorageKey?: string;
    class?: string;
};
export declare function Sidebar(props: SidebarProps): HTMLElement;
export type HeaderBarProps = {
    leading?: Node | (() => Node | null | undefined);
    title?: string | State<string> | Node | (() => Node | string);
    actions?: any;
    class?: string;
};
export declare function HeaderBar(props: HeaderBarProps): HTMLElement;
export type AppShellProps = {
    sidebar: Node | (() => Node);
    header?: Node | (() => Node | null | undefined);
    content: Node | (() => Node | null | undefined);
    footer?: Node | (() => Node | null | undefined);
    sidebarOpen?: State<boolean>;
    class?: string;
};
export declare function AppShell(props: AppShellProps): HTMLDivElement;
//# sourceMappingURL=layout.d.ts.map