import { type State } from "vanjs-core";
export type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
export type BadgeSize = "sm" | "md" | "lg";
export interface BadgeProps {
    id?: string;
    text?: string | number | State<string | number>;
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    class?: string;
    children?: any;
}
export declare function Badge(props: BadgeProps): HTMLSpanElement;
//# sourceMappingURL=badge.d.ts.map