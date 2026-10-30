/**
 * Regresión: al cambiar el idioma, el calendario a veces quedaba VACÍO
 * ("a veces comienzas con español y colocas inglés y deja de aparecer").
 *
 * Causa raíz: renderCalendar() leía raw() directamente, capturando
 * currentLocale/revision como deps del binding exterior `() =>
 * renderCalendar()` — cada cambio de idioma reconstruía el calendario
 * entero, acumulando bindings internos del grid anclados a tablas detached
 * que terminaban robando la tabla viva.
 *
 * El fix convierte los labels en derives top-level: el binding exterior ya
 * no tiene deps (corre una sola vez) y la reactividad de idioma vive en los
 * bindings internos (título, grid, labels). Los waits cruzan el ciclo de GC
 * de van (1000 ms), donde el bug se manifestaba.
 */
import { describe, test, expect, afterEach } from "bun:test";
import van from "vanjs-core";
import { DatePicker } from "../src/components/datepicker.js";
import { i18n } from "../src/i18n.js";

const flush = () => new Promise((r) => setTimeout(r, 30));
const crossGc = () => new Promise((r) => setTimeout(r, 1200));

const headers = (el: HTMLElement) => el.querySelectorAll("thead th").length;
const dayButtons = (el: HTMLElement) => el.querySelectorAll("tbody button").length;

afterEach(() => {
  i18n.setLocale("en");
  document.body.replaceChildren();
});

describe("DatePicker × cambio de idioma (regresión calendario vacío)", () => {
  test("popup: el grid sobrevive a switches de idioma cruzando ciclos de GC", async () => {
    i18n.setLocale("es");
    const value = van.state<Date | null>(null);
    const popup = DatePicker({ name: "venc", value, required: true }).dom() as HTMLElement;
    document.body.replaceChildren(popup);
    await flush();

    expect(headers(popup)).toBe(7);
    expect(dayButtons(popup)).toBeGreaterThan(27);

    // es → en cruzando el ciclo de GC de van
    i18n.setLocale("en");
    await crossGc();
    expect(headers(popup)).toBe(7);
    expect(dayButtons(popup)).toBeGreaterThan(27);

    // en → es (el reporte: "el de español deja de aparecer")
    i18n.setLocale("es");
    await crossGc();
    expect(headers(popup)).toBe(7);
    expect(dayButtons(popup)).toBeGreaterThan(27);

    // Abrir el popup: calendario presente y en el idioma actual
    const input = popup.querySelector("input[type=text]") as HTMLInputElement;
    input.click();
    await flush();
    const popupEl = popup.querySelector(".datepicker-popup") as HTMLElement;
    expect(popupEl.className).not.toContain("hidden");
    expect(headers(popupEl)).toBe(7);
    expect(dayButtons(popupEl)).toBeGreaterThan(27);
    expect(popupEl.querySelectorAll("button[aria-label='Mes anterior']").length).toBe(1);
  });

  test("popup + inline compartiendo valor: ambos grids sobreviven", async () => {
    i18n.setLocale("es");
    const value = van.state<Date | null>(null);
    const popup = DatePicker({ name: "venc", value }).dom() as HTMLElement;
    const inline = DatePicker({
      inline: true,
      value,
      min: new Date(2026, 0, 1),
      max: new Date(2026, 11, 31),
    }).dom() as HTMLElement;
    document.body.replaceChildren(popup, inline);
    await flush();

    i18n.setLocale("en");
    await crossGc();
    i18n.setLocale("es");
    await crossGc();
    i18n.setLocale("en");
    await crossGc();

    expect(headers(popup)).toBe(7);
    expect(headers(inline)).toBe(7);
    expect(dayButtons(popup)).toBeGreaterThan(27);
    expect(dayButtons(inline)).toBeGreaterThan(27);
  });
});
