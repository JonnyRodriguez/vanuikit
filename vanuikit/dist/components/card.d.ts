import { type ChildDom } from "vanjs-core";
export interface CardOptions {
    /** Sombra al pasar el mouse (para tarjetas clickeables). */
    hoverable?: boolean;
    /** El padding NO va incluido: el consumidor decide (p-4/p-6, full-bleed). */
    class?: string;
    [key: string]: any;
}
/** Contenedor tipo tarjeta: superficie + borde + sombra sutil. */
export declare const Card: (props?: CardOptions, ...children: ChildDom[]) => ChildDom;
export interface CardTitleOptions {
    class?: string;
    [key: string]: any;
}
/** Título estándar de tarjeta (h3). */
export declare const CardTitle: (props?: CardTitleOptions, ...children: ChildDom[]) => ChildDom;
//# sourceMappingURL=card.d.ts.map