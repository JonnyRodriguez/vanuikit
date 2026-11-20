import { describe, test, expect } from "bun:test";
import { van, Svg, SvgPath, Checkbox, Sidebar } from "../src/index.js";

const { div } = van.tags;

/**
 * Critical vanuikit rule: EVERY <svg> must be created with the real SVG
 * namespace (Svg). `van.tags.svg` produces an element in the HTML namespace
 * that does not render as a vector — the regression is caught with
 * `instanceof SVGSVGElement`.
 */
describe("Svg (real namespace)", () => {
  test("Svg creates a real SVGSVGElement with getBBox", () => {
    const host = document.createElement("div");
    van.add(host, Svg({ viewBox: "0 0 24 24" }, SvgPath({ d: "M15 18 9 12l6-6" })));

    const svg = host.querySelector("svg") as unknown;
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(typeof (svg as SVGSVGElement).getBBox).toBe("function");
    const p = host.querySelector("path");
    expect(p?.getAttribute("d")).toBe("M15 18 9 12l6-6");
  });

  test("Checkbox renders its SVG with the real namespace", () => {
    const host = document.createElement("div");
    van.add(host, Checkbox({ label: "I agree" }).dom());
    const svg = host.querySelector("svg");
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(typeof (svg as SVGSVGElement).getBBox).toBe("function");
  });

  test("collapsible Sidebar renders its chevron with the real namespace", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    van.add(host, Sidebar({ content: div("x"), collapsible: true }));
    const svg = host.querySelector('aside button[aria-expanded] svg');
    expect(svg).toBeInstanceOf(SVGSVGElement);
    host.remove();
  });
});
