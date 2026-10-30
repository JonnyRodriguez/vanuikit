import { type ChildDom } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export type AvatarSize = "xs" | "sm" | "md" | "lg";
export interface AvatarOptions {
    /** Nombre para las iniciales (y title/aria-label). Admite State. */
    name?: ToggleText;
    /** Imagen; si falla la carga (o no hay) se muestran las iniciales. */
    src?: string;
    size?: AvatarSize;
    class?: string;
    [key: string]: any;
}
/**
 * Iniciales de un nombre: primera letra de las dos primeras palabras, o las
 * dos primeras letras si hay una sola. Compartida con UserBadge.
 */
export declare const getInitials: (name: string, fallback?: string) => string;
/**
 * Avatar con fallback de iniciales: muestra la imagen de `src` y, si falla
 * la carga o no hay, las iniciales de `name` sobre el color primario.
 */
export declare const Avatar: (props?: AvatarOptions) => ChildDom;
//# sourceMappingURL=avatar.d.ts.map