import { describe, test, expect } from "bun:test";
import { Badge, type BadgeVariant } from "../src/components/badge.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

/** Los badges van con tokens del tema (--vui-*): ninguna variante puede
 *  colar clases de paleta cruda (fallarían al re-tematizar y rompían el
 *  contraste en modo claro — los -fg son los legibles sobre el tinte). */
const RAW_PALETTE = /(blue|emerald|rose|amber|slate|green|red)-\d/;

describe("Badge", () => {
  test("variantes suaves: tinte al 10% + texto con el -fg del estado", () => {
    const cases: [BadgeVariant, string, string][] = [
      ["primary", "bg-accent/10", "text-accent-fg"],
      ["secondary", "bg-secondary/20", "text-foreground-soft"],
      ["success", "bg-success/10", "text-success-fg"],
      ["warning", "bg-warning/10", "text-warning-fg"],
      ["danger", "bg-destructive/10", "text-destructive-fg"],
    ];
    for (const [variant, bg, fg] of cases) {
      const el = mount(Badge({ text: "x", variant }) as HTMLElement);
      expect(el.className).toContain(bg);
      expect(el.className).toContain(fg);
      expect(el.className).not.toMatch(RAW_PALETTE);
    }
  });

  test("outline: transparente con borde del tema y texto foreground-soft", () => {
    const el = mount(Badge({ text: "x", variant: "outline" }) as HTMLElement);
    expect(el.className).toContain("bg-transparent");
    expect(el.className).toContain("border-border");
    expect(el.className).toContain("text-foreground-soft");
  });

  test("danger usa destructive (red) igual que el botón destructivo", () => {
    const el = mount(Badge({ text: "x", variant: "danger" }) as HTMLElement);
    expect(el.className).toContain("bg-destructive/10");
    expect(el.className).not.toContain("rose");
  });

  test("dot con el color base del estado", () => {
    const el = mount(Badge({ text: "ok", variant: "success", dot: true }) as HTMLElement);
    const dot = el.firstElementChild as HTMLElement;
    expect(dot.className).toContain("bg-success");
    expect(dot.className).not.toMatch(RAW_PALETTE);
  });

  test("tamaños sm/md/lg", () => {
    expect((mount(Badge({ text: "x", size: "sm" }) as HTMLElement)).className).toContain(
      "text-[10px]",
    );
    expect((mount(Badge({ text: "x", size: "md" }) as HTMLElement)).className).toContain("text-xs");
    expect((mount(Badge({ text: "x", size: "lg" }) as HTMLElement)).className).toContain("text-sm");
  });
});
