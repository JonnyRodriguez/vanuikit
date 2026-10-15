import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { Alert } from "../src/components/alert.js";
import { Progress } from "../src/components/progress.js";
import { Skeleton } from "../src/components/skeleton.js";
import { EmptyState } from "../src/components/empty-state.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS actualiza los bindings en un microtask; hay que esperarlo.
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("Alert", () => {
  test("pinta la variante, el título, el contenido y role=alert", () => {
    const el = mount(
      Alert({ variant: "success", title: "Guardado" }, "Tus cambios quedaron aplicados.") as HTMLElement,
    );
    expect(el.getAttribute("role")).toBe("alert");
    expect(el.className).toContain("bg-emerald-500/10");
    expect(el.textContent).toContain("Guardado");
    expect(el.textContent).toContain("Tus cambios quedaron aplicados.");
  });

  test("dismissible: el botón oculta el aviso y avisa via onDismiss", async () => {
    let dismissed = false;
    const el = mount(
      Alert({ dismissible: true, onDismiss: () => (dismissed = true) }, "Atención") as HTMLElement,
    );
    const button = el.querySelector("button") as HTMLButtonElement;
    expect(button.getAttribute("aria-label")).toBe("Dismiss alert");

    button.click();
    await tick();

    expect(dismissed).toBe(true);
    expect(el.className).toContain("hidden");
  });

  test("showIcon: false omite el ícono; icon personalizado lo reemplaza", () => {
    const plain = mount(Alert({ showIcon: false }, "Sin ícono") as HTMLElement);
    expect(plain.querySelector("span[aria-hidden]")).toBeNull();

    const custom = mount(
      Alert({ icon: van.tags.span("🚀") }, "Con cohete") as HTMLElement,
    );
    expect(custom.querySelector("span[aria-hidden]")?.textContent).toBe("🚀");
  });
});

describe("Progress", () => {
  test("aria-valuenow y width reactivos al State", async () => {
    const value = van.state(25);
    const el = mount(Progress({ value, label: "Subida" }) as HTMLElement);
    const track = el.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = track.firstElementChild as HTMLElement;

    expect(track.getAttribute("aria-valuenow")).toBe("25");
    expect(el.textContent).toContain("Subida");
    expect(el.textContent).toContain("25%");

    value.val = 80;
    await tick();
    expect(track.getAttribute("aria-valuenow")).toBe("80");
    expect(fill.style.width).toBe("80%");
    expect(el.textContent).toContain("80%");
  });

  test("acota el porcentaje al rango 0–100", async () => {
    const value = van.state(250);
    const el = mount(Progress({ value }) as HTMLElement);
    const track = el.querySelector('[role="progressbar"]') as HTMLElement;

    expect(track.getAttribute("aria-valuenow")).toBe("100");

    value.val = -5;
    await tick();
    expect(track.getAttribute("aria-valuenow")).toBe("0");
  });

  test("indeterminada: pulsa, oculta el porcentaje y no fija width", async () => {
    const el = mount(Progress({ indeterminate: true, label: "Cargando" }) as HTMLElement);
    const track = el.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = track.firstElementChild as HTMLElement;

    expect(fill.className).toContain("animate-pulse");
    expect(fill.className).toContain("w-1/3");
    expect(fill.style.width).toBe("");
    expect(el.textContent).toContain("Cargando");
    const valueSpan = el.querySelector(".progress-value") as HTMLElement;
    expect(valueSpan.className).toContain("hidden");
  });

  test("showValue: false oculta el porcentaje incluso determinada", () => {
    const el = mount(Progress({ value: 40, showValue: false }) as HTMLElement);
    expect(el.textContent).not.toContain("%");
  });
});

describe("Skeleton", () => {
  test("texto: default 3 líneas, la última más corta", () => {
    const el = mount(Skeleton() as HTMLElement);
    const lines = [...el.children] as HTMLElement[];
    expect(lines.length).toBe(3);
    expect(lines[0].className).toContain("w-full");
    expect(lines[2].className).toContain("w-2/3");
  });

  test("lines controla la cantidad; circle y block usan sus formas", () => {
    expect((mount(Skeleton({ lines: 5 }) as HTMLElement)).children.length).toBe(5);

    const circle = mount(Skeleton({ variant: "circle" }) as HTMLElement);
    expect(circle.className).toContain("rounded-full");

    const block = mount(Skeleton({ variant: "block" }) as HTMLElement);
    expect(block.className).toContain("h-24");
  });

  test("todos los skeleton pulsan (animate-pulse)", () => {
    for (const variant of ["text", "circle", "block"] as const) {
      const el = mount(Skeleton({ variant }) as HTMLElement);
      const pulsing =
        (el.className.includes("animate-pulse") ? el : el.querySelector(".animate-pulse"));
      expect(pulsing).toBeTruthy();
    }
  });
});

describe("EmptyState", () => {
  test("renderiza ícono default, título, descripción y acción", () => {
    const el = mount(
      EmptyState(
        { title: "Sin datos", description: "Aún no hay registros", action: van.tags.button("Crear") },
      ) as HTMLElement,
    );
    expect(el.textContent).toContain("📭");
    expect(el.textContent).toContain("Sin datos");
    expect(el.textContent).toContain("Aún no hay registros");
    expect(el.querySelector("button")?.textContent).toBe("Crear");
  });

  test("ícono personalizado reemplaza el default", () => {
    const el = mount(EmptyState({ icon: "🔍", title: "Sin resultados" }) as HTMLElement);
    expect(el.textContent).toContain("🔍");
    expect(el.textContent).not.toContain("📭");
  });
});
