export type SkeletonVariant = "text" | "circle" | "block";
export interface SkeletonOptions {
    variant?: SkeletonVariant;
    /** Para la variante "text": número de líneas (la última queda más corta). */
    lines?: number;
    class?: string;
    [key: string]: any;
}
/**
 * Placeholder de contenido mientras carga: líneas de texto (default),
 * círculo (avatar) o bloque (tarjeta). Decorativo: `aria-hidden` para que
 * los lectores de pantalla lo ignoren.
 */
export declare const Skeleton: (props?: SkeletonOptions) => HTMLDivElement;
//# sourceMappingURL=skeleton.d.ts.map