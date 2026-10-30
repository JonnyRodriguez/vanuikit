import { type State, type ChildDom } from "vanjs-core";
export interface TabItem {
    id: string;
    label: string | State<string>;
    icon?: ChildDom;
    badge?: string | number | State<string | number>;
    disabled?: boolean;
    /**
     * Fábrica del contenido: se ejecuta en CADA activación de la pestaña.
     *
     * Es obligatorio que sea función (no un nodo pre-construido): los paneles
     * inactivos están detached del DOM y van elimina sus bindings — un nodo
     * pre-construido quedaría congelado en el idioma/estado del montaje.
     */
    content: () => ChildDom;
}
export interface TabsProps {
    id?: string;
    items: TabItem[];
    defaultTab?: string;
    activeTab?: State<string>;
    variant?: "underline" | "pills" | "boxed";
    class?: string;
    tabsClass?: string;
    contentClass?: string;
    onChange?: (tabId: string) => void;
}
/**
 * Componente Tabs accesible y reactivo.
 *
 * Soporta navegación por teclado (flechas ←/→, Home, End), roles ARIA
 * (tablist, tab, tabpanel), badges, iconos y variantes visuales (underline, pills, boxed).
 */
export declare function Tabs(props: TabsProps): HTMLDivElement;
//# sourceMappingURL=tabs.d.ts.map