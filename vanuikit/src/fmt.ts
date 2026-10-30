import van, { type State } from "vanjs-core";
import { i18n as defaultI18n, type I18nInstance } from "./i18n.js";

export type DateInput = Date | number | string;

export interface FmtCurrencyOptions extends Intl.NumberFormatOptions {
  /** Código ISO 4217 (default "USD"). */
  currency?: string;
}

export type RelativeUnit = Intl.RelativeTimeFormatUnit;

/** Fecha válida o null si no se puede interpretar. */
const toDate = (value: DateInput): Date | null => {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const fmtDate = (locale: string, value: DateInput, opts?: Intl.DateTimeFormatOptions): string => {
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", ...opts }).format(d);
};

const fmtTime = (locale: string, value: DateInput, opts?: Intl.DateTimeFormatOptions): string => {
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(locale, { timeStyle: "short", ...opts }).format(d);
};

const fmtNumber = (locale: string, value: number, opts?: Intl.NumberFormatOptions): string =>
  new Intl.NumberFormat(locale, opts).format(value);

const fmtCurrency = (locale: string, value: number, opts?: FmtCurrencyOptions): string =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "USD", ...opts }).format(value);

const fmtPercent = (locale: string, value: number, opts?: Intl.NumberFormatOptions): string =>
  new Intl.NumberFormat(locale, { style: "percent", ...opts }).format(value);

const fmtRelative = (
  locale: string,
  value: number,
  unit: RelativeUnit,
  opts?: Intl.RelativeTimeFormatOptions,
): string => new Intl.RelativeTimeFormat(locale, { numeric: "auto", ...opts }).format(value, unit);

/**
 * Fábrica de formateadores locale-aware: la contraparte de `t()`/`raw()`
 * para fechas, números, moneda, porcentajes y tiempos relativos. Los
 * formateadores reactivos retornan `State<string>` que muta al cambiar
 * `currentLocale` (úsalos como hijos/props, creados UNA vez fuera de los
 * bindings — igual que `t()`, no hay memoización); `fmt.raw.*` resuelve al
 * instante para consumo imperativo (handlers, toasts).
 */
export function createFmt(i18n: I18nInstance = defaultI18n) {
  const withLocale = <T>(compute: (locale: string) => T): State<T> =>
    van.derive(() => {
      void i18n.currentLocale.val;
      return compute(i18n.currentLocale.val);
    });

  const reactive = {
    date: (value: DateInput, opts?: Intl.DateTimeFormatOptions) =>
      withLocale((locale) => fmtDate(locale, value, opts)),
    datetime: (value: DateInput, opts?: Intl.DateTimeFormatOptions) =>
      withLocale((locale) => fmtDate(locale, value, { timeStyle: "short", ...opts })),
    time: (value: DateInput, opts?: Intl.DateTimeFormatOptions) =>
      withLocale((locale) => fmtTime(locale, value, opts)),
    number: (value: number, opts?: Intl.NumberFormatOptions) =>
      withLocale((locale) => fmtNumber(locale, value, opts)),
    currency: (value: number, opts?: FmtCurrencyOptions) =>
      withLocale((locale) => fmtCurrency(locale, value, opts)),
    percent: (value: number, opts?: Intl.NumberFormatOptions) =>
      withLocale((locale) => fmtPercent(locale, value, opts)),
    relative: (value: number, unit: RelativeUnit, opts?: Intl.RelativeTimeFormatOptions) =>
      withLocale((locale) => fmtRelative(locale, value, unit, opts)),
  };

  const raw = {
    date: (value: DateInput, opts?: Intl.DateTimeFormatOptions) =>
      fmtDate(i18n.currentLocale.val, value, opts),
    datetime: (value: DateInput, opts?: Intl.DateTimeFormatOptions) =>
      fmtDate(i18n.currentLocale.val, value, { timeStyle: "short", ...opts }),
    time: (value: DateInput, opts?: Intl.DateTimeFormatOptions) =>
      fmtTime(i18n.currentLocale.val, value, opts),
    number: (value: number, opts?: Intl.NumberFormatOptions) =>
      fmtNumber(i18n.currentLocale.val, value, opts),
    currency: (value: number, opts?: FmtCurrencyOptions) =>
      fmtCurrency(i18n.currentLocale.val, value, opts),
    percent: (value: number, opts?: Intl.NumberFormatOptions) =>
      fmtPercent(i18n.currentLocale.val, value, opts),
    relative: (value: number, unit: RelativeUnit, opts?: Intl.RelativeTimeFormatOptions) =>
      fmtRelative(i18n.currentLocale.val, value, unit, opts),
  };

  return { ...reactive, raw };
}

export type Fmt = ReturnType<typeof createFmt>;

/** Singleton global de formateo, atado al singleton `i18n`. */
export const fmt = createFmt(defaultI18n);
