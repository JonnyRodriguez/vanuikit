import { type State } from "vanjs-core";
import { type I18nInstance } from "./i18n.js";
export type DateInput = Date | number | string;
export interface FmtCurrencyOptions extends Intl.NumberFormatOptions {
    /** Código ISO 4217 (default "USD"). */
    currency?: string;
}
export type RelativeUnit = Intl.RelativeTimeFormatUnit;
/**
 * Fábrica de formateadores locale-aware: la contraparte de `t()`/`raw()`
 * para fechas, números, moneda, porcentajes y tiempos relativos. Los
 * formateadores reactivos retornan `State<string>` que muta al cambiar
 * `currentLocale` (úsalos como hijos/props, creados UNA vez fuera de los
 * bindings — igual que `t()`, no hay memoización); `fmt.raw.*` resuelve al
 * instante para consumo imperativo (handlers, toasts).
 */
export declare function createFmt(i18n?: I18nInstance): {
    raw: {
        date: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => string;
        datetime: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => string;
        time: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => string;
        number: (value: number, opts?: Intl.NumberFormatOptions) => string;
        currency: (value: number, opts?: FmtCurrencyOptions) => string;
        percent: (value: number, opts?: Intl.NumberFormatOptions) => string;
        relative: (value: number, unit: RelativeUnit, opts?: Intl.RelativeTimeFormatOptions) => string;
    };
    date: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>;
    datetime: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>;
    time: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>;
    number: (value: number, opts?: Intl.NumberFormatOptions) => State<string>;
    currency: (value: number, opts?: FmtCurrencyOptions) => State<string>;
    percent: (value: number, opts?: Intl.NumberFormatOptions) => State<string>;
    relative: (value: number, unit: RelativeUnit, opts?: Intl.RelativeTimeFormatOptions) => State<string>;
};
export type Fmt = ReturnType<typeof createFmt>;
/** Singleton global de formateo, atado al singleton `i18n`. */
export declare const fmt: {
    raw: {
        date: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => string;
        datetime: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => string;
        time: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => string;
        number: (value: number, opts?: Intl.NumberFormatOptions) => string;
        currency: (value: number, opts?: FmtCurrencyOptions) => string;
        percent: (value: number, opts?: Intl.NumberFormatOptions) => string;
        relative: (value: number, unit: RelativeUnit, opts?: Intl.RelativeTimeFormatOptions) => string;
    };
    date: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>;
    datetime: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>;
    time: (value: DateInput, opts?: Intl.DateTimeFormatOptions) => State<string>;
    number: (value: number, opts?: Intl.NumberFormatOptions) => State<string>;
    currency: (value: number, opts?: FmtCurrencyOptions) => State<string>;
    percent: (value: number, opts?: Intl.NumberFormatOptions) => State<string>;
    relative: (value: number, unit: RelativeUnit, opts?: Intl.RelativeTimeFormatOptions) => State<string>;
};
//# sourceMappingURL=fmt.d.ts.map