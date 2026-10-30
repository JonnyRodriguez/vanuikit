import { type ChildDom } from "vanjs-core";
export interface KbdOptions {
    size?: "sm" | "md";
    class?: string;
    [key: string]: any;
}
/** Tecla estilizada semántica (`<kbd>`): atajos, combinaciones, hints de UI. */
export declare const Kbd: (props?: KbdOptions, ...children: ChildDom[]) => ChildDom;
//# sourceMappingURL=kbd.d.ts.map