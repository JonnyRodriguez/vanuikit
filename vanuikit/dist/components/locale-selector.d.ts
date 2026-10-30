import { type I18nInstance } from "../i18n.js";
export interface LocaleOption {
    code: string;
    label: string;
    /** Deprecated: el flag ahora se deriva del código con SVG multicolor. */
    flag?: string;
}
export interface LocaleSelectorProps {
    i18n?: I18nInstance;
    /** Lista personalizada de opciones o autodetectada desde los diccionarios cargados */
    options?: LocaleOption[];
    /** Variante visual: "select" (dropdown nativo estilizado) o "buttons" (pastillas de selección) */
    variant?: "select" | "buttons";
    /** Clases CSS adicionales */
    class?: string;
}
/**
 * Componente nativo y autocontenido para cambiar de idioma / locale.
 * Embebido directamente en VanUikit para máxima focalización y cero boilerplate en las aplicaciones.
 */
export declare function LocaleSelector(props?: LocaleSelectorProps): HTMLDivElement | HTMLSelectElement;
//# sourceMappingURL=locale-selector.d.ts.map