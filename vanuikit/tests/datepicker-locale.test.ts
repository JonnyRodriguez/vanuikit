/**
 * Regression: after a language switch the calendar sometimes went EMPTY
 * ("sometimes you start with Spanish, switch to English and it stops rendering").
 *
 * Root cause: renderCalendar() read raw() directly, capturing
 * currentLocale/revision as deps of the outer binding `() =>
 * renderCalendar()` — every language change rebuilt the whole calendar,
 * accumulating grid bindings anchored to detached tables that ended up
 * stealing the live table.
 *
 * The fix turns labels into top-level derives: the outer binding no longer
 * has deps (runs once) and locale reactivity lives in the inner bindings
 * (title, grid, labels). The waits cross van's GC cycle (1000 ms), where
 * the bug manifested.
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

describe("DatePicker × language switch (empty calendar regression)", () => {
  test("popup: the grid survives language switches crossing GC cycles", async () => {
    i18n.setLocale("es");
    const value = van.state<Date | null>(null);
    const popup = DatePicker({ name: "venc", value, required: true }).dom() as HTMLElement;
    document.body.replaceChildren(popup);
    await flush();

    expect(headers(popup)).toBe(7);
    expect(dayButtons(popup)).toBeGreaterThan(27);

    // es → en crossing van's GC cycle
    i18n.setLocale("en");
    await crossGc();
    expect(headers(popup)).toBe(7);
    expect(dayButtons(popup)).toBeGreaterThan(27);

    // en → es (the report: "the Spanish one stops rendering")
    i18n.setLocale("es");
    await crossGc();
    expect(headers(popup)).toBe(7);
    expect(dayButtons(popup)).toBeGreaterThan(27);

    // Open the popup: calendar present and in the current language
    const input = popup.querySelector("input[type=text]") as HTMLInputElement;
    input.click();
    await flush();
    const popupEl = popup.querySelector(".datepicker-popup") as HTMLElement;
    expect(popupEl.className).not.toContain("hidden");
    expect(headers(popupEl)).toBe(7);
    expect(dayButtons(popupEl)).toBeGreaterThan(27);
    expect(popupEl.querySelectorAll("button[aria-label='Mes anterior']").length).toBe(1);
  });

  test("popup + inline sharing a value: both grids survive", async () => {
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
