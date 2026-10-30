import { type State, type ChildDom } from "vanjs-core";
export type SvgProps = {
    viewBox?: string;
    fill?: string;
    stroke?: string;
    style?: string;
    class?: string | (() => string) | State<string>;
    "aria-hidden"?: string | boolean;
    [k: string]: any;
};
/**
 * Svg — <svg> con namespace real (SVGSVGElement).
 * Reemplaza a `van.tags.svg`; sin este wrapper los íconos no se pintan.
 */
export declare function Svg(props: SvgProps, ...children: ChildDom[]): Element;
export type SvgPathProps = {
    d: string;
    class?: string | (() => string) | State<string>;
    [k: string]: any;
};
/**
 * SvgPath — <path> dentro de un Svg (hereda fill/stroke del padre).
 */
export declare function SvgPath(props: SvgPathProps): Element;
//# sourceMappingURL=svg.d.ts.map