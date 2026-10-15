import { describe, test, expect } from "bun:test";
import { createI18n } from "../src/i18n.js";
import { createFmt } from "../src/fmt.js";

// Instancia i18n aislada: mutar el singleton global desde los tests lo
// contaminaría para los demás archivos (registro de módulos compartido).
const i18n = createI18n({ defaultLocale: "en", locales: { en: {}, es: {} } });
// localStorage persiste entre archivos de test: fuerza el locale inicial.
i18n.setLocale("en");
const fmt = createFmt(i18n);

// VanJS actualiza los bindings en un microtask; hay que esperarlo.
const tick = () => new Promise((r) => setTimeout(r, 0));

// Fecha estable e inocua en zona horaria: mediodía UTC.
const DATE = new Date(Date.UTC(2026, 9, 15, 12, 0, 0));

describe("fmt — resolución por locale", () => {
  test("number: separadores de miles y coma decimal en es vs en", () => {
    // 7 dígitos: el agrupamiento es determinista (es agrupa a partir de 5).
    expect(fmt.raw.number(1234567.89)).toContain("1,234,567.89");
    i18n.setLocale("es");
    expect(fmt.raw.number(1234567.89)).toContain("1.234.567,89");
    i18n.setLocale("en");
  });

  test("currency: símbolo USD con separadores por locale", () => {
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

  test("date: día y año presentes, mes según locale", () => {
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

  test("datetime incluye la hora; time solo la hora", () => {
    const dt = fmt.raw.datetime(DATE);
    expect(dt).toContain("2026");
    expect(dt).toMatch(/\d{1,2}:\d{2}/);
    expect(fmt.raw.time(DATE)).toMatch(/\d{1,2}:\d{2}/);
  });

  test("relative: ayer/yesterday con numeric auto", () => {
    expect(fmt.raw.relative(-1, "day")).toBe("yesterday");
    i18n.setLocale("es");
    expect(fmt.raw.relative(-1, "day")).toBe("ayer");
    i18n.setLocale("en");
  });

  test("acepta Date, timestamp e ISO string", () => {
    const ts = DATE.getTime();
    expect(fmt.raw.date(ts)).toBe(fmt.raw.date(DATE));
    expect(fmt.raw.date(DATE.toISOString().slice(0, 10))).toBe(fmt.raw.date(DATE));
  });

  test("fecha inválida: string vacío, sin excepciones", () => {
    expect(fmt.raw.date("no-es-fecha")).toBe("");
    expect(fmt.raw.datetime("2026-13-45")).toBe("");
  });
});

describe("fmt — reactividad al cambiar locale", () => {
  test("el State muta tras setLocale", async () => {
    const price = fmt.currency(99.5, { minimumFractionDigits: 2 });
    expect(price.val).toContain("99.50");

    i18n.setLocale("es");
    await tick();
    expect(price.val).toContain("99,50");

    i18n.setLocale("en");
    await tick();
    expect(price.val).toContain("99.50");
  });

  test("en el DOM: insertar el State como hijo y cambiar locale", async () => {
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

  test("raw retorna string plano, no State", () => {
    expect(typeof fmt.raw.number(5)).toBe("string");
    expect(typeof fmt.date(5)).toBe("object");
  });
});
