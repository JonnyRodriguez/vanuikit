import van, { type State, type ChildDom } from "vanjs-core";

/**
 * SVG namespace. In VanJS, `van.tags.svg` creates the element with
 * `document.createElement("svg")` (HTML namespace), so child <path>
 * elements are not rendered as vectors. This module encapsulates the
 * only correct way: `document.createElementNS` via `van.tags(SVG_NS)`.
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
 * Svg — <svg> with a real namespace (SVGSVGElement).
 * Replaces `van.tags.svg`; without this wrapper icons are not painted.
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
 * SvgPath — <path> inside an Svg (inherits fill/stroke from the parent).
 */
export function SvgPath(props: SvgPathProps) {
  const { d, ...rest } = props;
  return path({ d, ...rest } as any);
}
