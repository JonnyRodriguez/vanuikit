import { describe, test, expect } from "bun:test";
import { van, Icon } from "../src/index.js";

describe("Icon", () => {
  test("crea un SVGSVGElement real con paths y aria-hidden", () => {
    const host = document.createElement("div");
    van.add(host, Icon({ name: "sun" }));

    const svg = host.querySelector("svg") as unknown;
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect((svg as SVGSVGElement).getAttribute("aria-hidden")).toBe("true");
    expect(host.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  test("aplica clase base y clase custom", () => {
    const host = document.createElement("div");
    van.add(host, Icon({ name: "moon", class: "text-primary" }));
    const svg = host.querySelector("svg") as HTMLElement;
    const cls = svg.getAttribute("class") ?? "";
    expect(cls).toContain("shrink-0");
    expect(cls).toContain("size-4");
    expect(cls).toContain("text-primary");
  });

  test("class reactiva: función y State", async () => {
    const collapsed = van.state(false);
    const host = document.createElement("div");
    document.body.appendChild(host);
    van.add(
      host,
      Icon({ name: "chevron-left", class: () => (collapsed.val ? "rotate-180" : "") }),
    );
    const svg = host.querySelector("svg") as HTMLElement;
    expect(svg.getAttribute("class") ?? "").not.toContain("rotate-180");
    collapsed.val = true;
    await new Promise((r) => setTimeout(r, 0));
    expect(svg.getAttribute("class") ?? "").toContain("rotate-180");
    host.remove();
  });
});
