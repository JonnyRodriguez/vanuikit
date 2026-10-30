import { describe, test, expect } from "bun:test";
import { van, Svg, SvgPath, Checkbox, Sidebar } from "../src/index.js";

const { div } = van.tags;

/**
 * Regla crítica de vankit: TODO <svg> debe crearse con el namespace SVG real
 * (Svg). `van.tags.svg` produce un elemento con namespace HTML que no se
 * dibuja como vector — la regresión se detecta con `instanceof SVGSVGElement`.
 */
describe("Svg (namespace real)", () => {
  test("Svg crea un SVGSVGElement real con getBBox", () => {
    const host = document.createElement("div");
    van.add(host, Svg({ viewBox: "0 0 24 24" }, SvgPath({ d: "M15 18 9 12l6-6" })));

    const svg = host.querySelector("svg") as unknown;
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(typeof (svg as SVGSVGElement).getBBox).toBe("function");
    const p = host.querySelector("path");
    expect(p?.getAttribute("d")).toBe("M15 18 9 12l6-6");
  });

  test("Checkbox renderiza su SVG con namespace real", () => {
    const host = document.createElement("div");
    van.add(host, Checkbox({ label: "Acepto" }).dom());
    const svg = host.querySelector("svg");
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(typeof (svg as SVGSVGElement).getBBox).toBe("function");
  });

  test("Sidebar colapsable renderiza su chevron con namespace real", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    van.add(host, Sidebar({ content: div("x"), collapsible: true }));
    const svg = host.querySelector('aside button[aria-expanded] svg');
    expect(svg).toBeInstanceOf(SVGSVGElement);
    host.remove();
  });
});
