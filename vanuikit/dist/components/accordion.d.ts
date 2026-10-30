import { type ChildDom, type State, type ValidChildDomValue } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export interface AccordionItem {
    id: string;
    title: ToggleText;
    /**
     * Fábrica del contenido: se invoca en cada apertura (contenido fresco con
     * bindings frescos — misma razón por la que TabItem.content es factory).
     */
    content: () => ValidChildDomValue;
    disabled?: boolean | State<boolean>;
}
export interface AccordionOptions {
    items: AccordionItem[];
    /** Permitir varios abiertos a la vez (default: uno solo). */
    multiple?: boolean;
    /** Ids abiertos al montar. */
    defaultOpen?: string[];
    class?: string;
    [key: string]: any;
}
/**
 * Acordeón accesible: botones con `aria-expanded`/`aria-controls` y paneles
 * `role="region"`. Con `multiple: false` (default) abrir uno cierra el
 * anterior. El contenido se construye al abrir (y re-construye en cada
 * apertura); el panel permanece montado mientras el ítem exista.
 */
export declare const Accordion: (props: AccordionOptions) => ChildDom;
//# sourceMappingURL=accordion.d.ts.map