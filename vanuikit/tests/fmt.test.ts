import { describe, test, expect } from "bun:test";
import { createI18n } from "../src/i18n.js";
import { createFmt } from "../src/fmt.js";

// Isolated i18n instance: mutating the global singleton from tests would
// pollute the other files (shared module registry).
const i18n = createI18n({ defaultLocale: "en", locales: { en: {}, es: {} } });
// localStorage persists across test files: force the initial locale.
i18n.setLocale("en");
const fmt = createFmt(i18n);

// VanJS updates bindings in a microtask; tests must wait for it.
const tick = () => new Promise((r) => setTimeout(r, 0));

// Timezone-stable and safe date: noon UTC.
const DATE = new Date(Date.UTC(2026, 9, 15, 12, 0, 0));

describe("fmt — locale resolution", () => {
  test("number: thousands separators and decimal comma in es vs en", () => {
    // 7 digits: grouping is deterministic (es groups from 5 up).
    expect(fmt.raw.number(1234567.89)).toContain("1,234,567.89");
    i18n.setLocale("es");
    expect(fmt.raw.number(1234567.89)).toContain("1.234.567,89");
    i18n.setLocale("en");
  });

  test("currency: USD symbol with locale separators", () => {
    const en = fmt.raw.currency(1234567.89);
    expect(en).toContain("1,234,567.89");
    i18n.setLocale("es");
    const es = fmt.raw.currency(1234567.89);
    expect(es).toContain("1.234.567,89");
    expect(es).toMatch(/US\$|\$/);
    i18n.setLocale("en");
  });

  test("currency custom (EUR)", () => {
    const s = fmt.raw.currency(10, { currency: "EUR" });
    expect(s).toContain("10");
    expect(s).toContain("€");
  });

  test("percent", () => {
    const en = fmt.raw.percent(0.5);
    expect(en).toContain("50");
    expect(en).toContain("%");
  });

  test("date: day and year present, month per locale", () => {
    const en = fmt.raw.date(DATE);
    expect(en).toContain("2026");
    expect(en).toMatch(/Oct/i);
    i18n.setLocale("es");
    const es = fmt.raw.date(DATE);
    expect(es).toContain("15");
    expect(es).toContain("2026");
    expect(es).toMatch(/oct/i);
    i18n.setLocale("en");
  });

  test("datetime includes the time; time only the time", () => {
    const dt = fmt.raw.datetime(DATE);
    expect(dt).toContain("2026");
    expect(dt).toMatch(/\d{1,2}:\d{2}/);
    expect(fmt.raw.time(DATE)).toMatch(/\d{1,2}:\d{2}/);
  });

  test("relative: yesterday/ayer with numeric auto", () => {
    expect(fmt.raw.relative(-1, "day")).toBe("yesterday");
    i18n.setLocale("es");
    expect(fmt.raw.relative(-1, "day")).toBe("ayer");
    i18n.setLocale("en");
  });

  test("accepts Date, timestamp and ISO string", () => {
    const ts = DATE.getTime();
    expect(fmt.raw.date(ts)).toBe(fmt.raw.date(DATE));
    expect(fmt.raw.date(DATE.toISOString().slice(0, 10))).toBe(fmt.raw.date(DATE));
  });

  test("invalid date: empty string, no exceptions", () => {
    expect(fmt.raw.date("no-es-fecha")).toBe("");
    expect(fmt.raw.datetime("2026-13-45")).toBe("");
  });
});

describe("fmt — reactivity on locale change", () => {
  test("the State mutates after setLocale", async () => {
    const price = fmt.currency(99.5, { minimumFractionDigits: 2 });
    expect(price.val).toContain("99.50");

    i18n.setLocale("es");
    await tick();
    expect(price.val).toContain("99,50");

    i18n.setLocale("en");
    await tick();
    expect(price.val).toContain("99.50");
  });

  test("in the DOM: insert the State as a child and change the locale", async () => {
    const van = (await import("vanjs-core")).default;
    const label = fmt.relative(-1, "day");
    const el = van.tags.span(label);
    document.body.replaceChildren(el);
    expect(el.textContent).toBe("yesterday");

    i18n.setLocale("es");
    await tick();
    expect(el.textContent).toBe("ayer");

    i18n.setLocale("en");
    await tick();
    document.body.replaceChildren();
  });

  test("raw returns a plain string, not a State", () => {
    expect(typeof fmt.raw.number(5)).toBe("string");
    expect(typeof fmt.date(5)).toBe("object");
  });
});
