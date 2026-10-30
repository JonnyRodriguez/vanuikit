import { type ThemeInstance } from "../theme.js";
import { type I18nInstance } from "../i18n.js";
/** Contrato de llaves de i18n del componente */
export declare const TEXTS: {
    readonly light: {
        readonly key: "theme.light";
        readonly default: "Claro";
    };
    readonly dark: {
        readonly key: "theme.dark";
        readonly default: "Oscuro";
    };
    readonly system: {
        readonly key: "theme.system";
        readonly default: "Sistema";
    };
    readonly selectLabel: {
        readonly key: "theme.selectLabel";
        readonly default: "Seleccionar tema visual";
    };
    readonly toggleLabel: {
        readonly key: "theme.toggleLabel";
        readonly default: "Alternar tema visual (Claro / Oscuro / Sistema)";
    };
    readonly toggleTitle: {
        readonly key: "theme.toggleTitle";
        readonly default: "Alternar tema (Claro / Oscuro / Sistema)";
    };
};
export interface ThemeToggleProps {
    theme?: ThemeInstance;
    i18n?: I18nInstance;
    /** Variante visual: "button" (un solo botón cíclico), "segmented" (botones para cada modo) */
    variant?: "button" | "segmented";
    /** Mostrar u ocultar texto explicativo junto al ícono */
    showLabel?: boolean;
    /** Clases CSS adicionales */
    class?: string;
    /** Soporta tema del sistema en el ciclo */
    includeSystem?: boolean;
}
/**
 * Componente nativo y autocontenido para alternar el tema visual (Claro / Oscuro / Sistema).
 * Embebido directamente en VanUikit para máxima focalización y cero boilerplate en las aplicaciones.
 */
export declare function ThemeToggle(props?: ThemeToggleProps): HTMLDivElement | HTMLButtonElement;
//# sourceMappingURL=theme-toggle.d.ts.map