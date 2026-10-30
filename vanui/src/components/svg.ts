import van, { type State, type ChildDom } from "vanjs-core";

/**
 * Namespace SVG. En VanJS, `van.tags.svg` crea el elemento con
 * `document.createElement("svg")` (namespace HTML), por lo que los <path>
 * hijos no se dibujan como vector. Este módulo encapsula la única forma
 * correcta: `document.createElementNS` vía `van.tags(SVG_NS)`.
 */
const SVG_NS = "http://www.w3.org/2000/svg";

const { svg, path } = van.tags(SVG_NS);

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
export function Svg(props: SvgProps, ...children: ChildDom[]) {
  return svg(props as any, ...children);
}

export type SvgPathProps = {
  d: string;
  class?: string | (() => string) | State<string>;
  [k: string]: any;
};

/**
 * SvgPath — <path> dentro de un Svg (hereda fill/stroke del padre).
 */
export function SvgPath(props: SvgPathProps) {
  const { d, ...rest } = props;
  return path({ d, ...rest } as any);
}
