import { type ChildDom } from "vanjs-core";
/** Variantes de color del botón (tokens semánticos del tema). Exportado para reuso (p. ej. Link variante "button"). */
export declare const VARIANT_CLASSES: {
    readonly primary: "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active shadow-primary-shadow";
    readonly secondary: "bg-secondary text-secondary-fg hover:bg-secondary-hover active:bg-secondary-active";
    readonly destructive: "bg-destructive text-white hover:opacity-90 active:opacity-80";
};
/** Tamaños estándar (bootstrap/shadcn-like). Exportado para reuso (p. ej. Link variante "button"). */
export declare const SIZE_CLASSES: {
    readonly sm: "text-sm px-3 py-1.5";
    readonly md: "text-base px-4 py-2";
    readonly lg: "text-lg px-6 py-3";
};
export type ButtonVariant = keyof typeof VARIANT_CLASSES;
export type ButtonSize = keyof typeof SIZE_CLASSES;
type ButtonProps = {
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    type?: "button" | "submit" | "reset";
    [key: string]: any;
};
/**
 * Botón unificado. `variant` y `size` son opcionales (defaults: primary, md).
 * `type` por defecto es "button" para no provocar submits accidentales:
 * pasa type: "submit" cuando vaya dentro de un Form.
 */
export declare const Button: (props?: ButtonProps, ...children: ChildDom[]) => HTMLButtonElement;
export declare const PrimaryButton: (props?: ButtonProps, ...children: ChildDom[]) => HTMLButtonElement;
export declare const SecondaryButton: (props?: ButtonProps, ...children: ChildDom[]) => HTMLButtonElement;
export {};
//# sourceMappingURL=button.d.ts.map