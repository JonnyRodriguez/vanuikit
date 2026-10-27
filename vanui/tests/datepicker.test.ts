import { describe, test, expect, afterEach } from "bun:test";
import van from "vanjs-core";
import { DatePicker } from "../src/components/datepicker.js";
import { Form } from "../src/components/form.js";
import { i18n } from "../src/i18n.js";

const { div } = van.tags;

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};
const tick = () => new Promise((r) => setTimeout(r, 0));

const dayBtn = (el: HTMLElement, isoDate: string) =>
  el.querySelector(`button[data-date="${isoDate}"]`) as HTMLButtonElement;

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

afterEach(() => {
  i18n.setLocale("en");
  document.body.replaceChildren();
});

describe("DatePicker — inline", () => {
  test("renderiza el grid y navega meses con prev/next", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 0, 15) });
    const el = mount(field.dom() as HTMLElement);

    expect(el.querySelector("table")).toBeTruthy();
    expect(el.textContent).toContain("January 2026");
    // 7 columnas de cabecera + botón del día 15 presente
    expect(el.querySelectorAll("thead th").length).toBe(7);
    expect(dayBtn(el, "2026-01-15")).toBeTruthy();
    expect(dayBtn(el, "2026-02-15")).toBeFalsy();

    // Navegar al mes siguiente: el título Y el grid deben actualizarse
    const next = el.querySelector('button[aria-label="Next month"]') as HTMLButtonElement;
    next.click();
    await tick();
    expect(el.textContent).toContain("February 2026");
    expect(dayBtn(el, "2026-02-15")).toBeTruthy();
    expect(dayBtn(el, "2026-01-15")).toBeFalsy();
  });

  test("navegar y luego seleccionar elige el día del mes visible (no enero)", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 0, 15) });
    const el = mount(field.dom() as HTMLElement);

    const next = el.querySelector('button[aria-label="Next month"]') as HTMLButtonElement;
    next.click();
    next.click();
    await tick();
    expect(dayBtn(el, "2026-03-20")).toBeTruthy();

    dayBtn(el, "2026-03-20").click();
    await tick();
    expect(field.value.val).toBe("2026-03-20");
  });

  test("dos pickers que comparten State: navegar y seleccionar en uno no rompe al otro", async () => {
    const shared = van.state<Date | null>(new Date(2026, 0, 15));
    const popup = DatePicker({ name: "due-date", value: shared, required: true });
    const inline = DatePicker({
      inline: true,
      value: shared,
      min: new Date(2026, 0, 1),
      max: new Date(2026, 11, 31),
    });
    const popupNode = popup.dom();
    const inlineNode = inline.dom();
    mount(div(popupNode, inlineNode));

    const nextInline = inlineNode.querySelector('button[aria-label="Next month"]') as HTMLButtonElement;
    nextInline.click();
    nextInline.click();
    await tick();
    expect(dayBtn(inlineNode, "2026-03-10")).toBeTruthy();

    dayBtn(inlineNode, "2026-03-10").click();
    await tick();
    expect(inline.value.val).toBe("2026-03-10");
    expect(shared.val!.getMonth()).toBe(2);
  });

  test("seleccionar un día actualiza field.value (ISO) y el State externo", async () => {
    const ext = van.state<Date | null>(new Date(2026, 0, 15));
    const field = DatePicker({ inline: true, value: ext });
    const el = mount(field.dom() as HTMLElement);

    dayBtn(el, "2026-01-20").click();
    await tick();

    expect(field.value.val).toBe("2026-01-20");
    expect(isoDate(ext.val!)).toBe("2026-01-20");
    expect(field.isTouched.val).toBe(true);
  });

  test("botón Hoy selecciona la fecha actual", async () => {
    const field = DatePicker({ inline: true });
    const el = mount(field.dom() as HTMLElement);

    const today = [...el.querySelectorAll("button")].find(
      (b) => b.textContent!.trim() === "Today",
    ) as HTMLButtonElement;
    today.click();
    await tick();

    expect(field.value.val).toBe(isoDate(new Date()));
  });
});

describe("DatePicker — popup", () => {
  test("abre al hacer click, elige y cierra", async () => {
    const field = DatePicker({ value: new Date(2026, 0, 15) });
    const el = mount(field.dom() as HTMLElement);

    const input = el.querySelector('input[type="text"]') as HTMLInputElement;
    const panel = el.querySelector(".datepicker-popup") as HTMLElement;

    expect(panel.classList.contains("hidden")).toBe(true);
    input.click();
    await tick();
    expect(panel.classList.contains("hidden")).toBe(false);

    dayBtn(el, "2026-01-20").click();
    await tick();
    expect(field.value.val).toBe("2026-01-20");
    expect(panel.classList.contains("hidden")).toBe(true);
  });

  test("Escape cierra el popup", async () => {
    const field = DatePicker({ value: new Date(2026, 0, 15) });
    const el = mount(field.dom() as HTMLElement);
    const panel = el.querySelector(".datepicker-popup") as HTMLElement;

    (el.querySelector('input[type="text"]') as HTMLInputElement).click();
    await tick();
    expect(panel.classList.contains("hidden")).toBe(false);

    (el.querySelector('input[type="text"]') as HTMLInputElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await tick();
    expect(panel.classList.contains("hidden")).toBe(true);
  });
});

describe("DatePicker — límites min/max", () => {
  test("deshabilita los días fuera del rango", () => {
    const field = DatePicker({
      inline: true,
      value: new Date(2026, 0, 15),
      min: new Date(2026, 0, 10),
      max: new Date(2026, 0, 20),
    });
    const el = mount(field.dom() as HTMLElement);

    expect(dayBtn(el, "2026-01-05").disabled).toBe(true);
    expect(dayBtn(el, "2026-01-10").disabled).toBe(false);
    expect(dayBtn(el, "2026-01-15").disabled).toBe(false);
    expect(dayBtn(el, "2026-01-20").disabled).toBe(false);
    expect(dayBtn(el, "2026-01-25").disabled).toBe(true);
  });
});

describe("DatePicker — Form", () => {
  test("required: sin fecha bloquea, con fecha pasa", async () => {
    let called = false;
    const form = Form(() => {
      called = true;
    });
    const field = DatePicker({ name: "due", required: true });
    form.add(field);
    const el = mount(form.dom() as HTMLFormElement);

    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(called).toBe(false);
    expect(field.isInvalid.val).toBe(true);

    // El grid muestra el mes actual; elegir el día 1 de este mes.
    const now = new Date();
    const dayOne = new Date(now.getFullYear(), now.getMonth(), 1);
    dayBtn(el, isoDate(dayOne)).click();
    await tick();

    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(called).toBe(true);
    expect(field.isInvalid.val).toBe(false);
  });
});

describe("DatePicker — reactividad de idioma", () => {
  test("el título del mes se reformatea al cambiar locale", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 0, 15) });
    mount(field.dom() as HTMLElement);
    expect(document.body.textContent).toContain("January");

    i18n.setLocale("es");
    await new Promise((r) => setTimeout(r, 20));
    expect(document.body.textContent).toContain("Enero");
  });
});

describe("DatePicker — teclado completo", () => {
  const grid = (el: HTMLElement) => el.querySelector('[tabindex="0"]') as HTMLElement;
  const key = (g: HTMLElement, k: string, opts: KeyboardEventInit = {}) =>
    g.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...opts }));

  test("PageUp/PageDown y Shift navegan meses y años", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 5, 15) });
    const el = mount(field.dom() as HTMLElement);
    const g = grid(el);

    key(g, "PageDown");
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-07-15");

    key(g, "PageDown", { shiftKey: true });
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2027-07-15");

    key(g, "PageUp");
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2027-06-15");

    key(g, "PageUp", { shiftKey: true });
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-06-15");
  });

  test("Home/End/Ctrl+Home/Ctrl+End van a bordes de mes/año", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 5, 15) });
    const el = mount(field.dom() as HTMLElement);
    const g = grid(el);

    key(g, "Home");
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-06-01");

    key(g, "End");
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-06-30");

    key(g, "Home", { ctrlKey: true });
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-01-01");

    key(g, "End", { ctrlKey: true });
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-12-31");
  });
});

describe("DatePicker — límites reactivos (State)", () => {
  test("mutar min/max actualiza los días deshabilitados", async () => {
    const min = van.state<Date | null>(null);
    const max = van.state<Date | null>(null);
    const field = DatePicker({ inline: true, value: new Date(2026, 0, 15), min, max });
    const el = mount(field.dom() as HTMLElement);

    expect(dayBtn(el, "2026-01-20").disabled).toBe(false);

    min.val = new Date(2026, 0, 18);
    max.val = new Date(2026, 0, 22);
    await tick();

    expect(dayBtn(el, "2026-01-15").disabled).toBe(true);
    expect(dayBtn(el, "2026-01-20").disabled).toBe(false);
    expect(dayBtn(el, "2026-01-25").disabled).toBe(true);
  });
});
