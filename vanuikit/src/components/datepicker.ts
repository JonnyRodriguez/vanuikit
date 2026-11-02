import van, { type State } from "vanjs-core";
import type { Validator, ValidatorMessage } from "../validators.js";
import { Required } from "../validators.js";
import { raw, t, i18n } from "../i18n.js";
import { cx } from "../util.js";
import { asState, createControlField, readState, type ControlField } from "./checkable.js";
import type { ToggleText } from "./checkbox.js";

export interface DatePickerOptions {
  /** Field name (label id + hidden input for FormData). */
  name?: string;
  /**
   * Selected date; accepts `Date` or `State<Date | null>` for two-way
   * binding (same contract as the rest of the catalog).
   */
  value?: Date | null | State<Date | null>;
  /** Optional field label (a <label> is rendered). */
  label?: ToggleText;
  placeholder?: ToggleText;
  disabled?: boolean | State<boolean>;
  /** Required: error on submit with no date (integration with `Form`). */
  required?: boolean;
  requiredMsg?: ToggleText;
  /**
   * Minimum selectable date (earlier days are disabled).
   * Accepts a `State<Date | null>` for reactive bounds.
   */
  min?: Date | null | State<Date | null>;
  /**
   * Maximum selectable date (later days are disabled).
   * Accepts a `State<Date | null>` for reactive bounds.
   */
  max?: Date | null | State<Date | null>;
  /** true = calendar always visible (no input/popup). */
  inline?: boolean;
  /** First day of week: 0=Sunday … 6=Saturday (default 1 = Monday). */
  firstDayOfWeek?: number;
  class?: string;
  [key: string]: any;
}

export interface DatePickerField extends ControlField<{ dom(): HTMLElement }> {}

let nextId = 0;

const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const iso = (d: Date | null): string =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`
    : "";

const parseIso = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
};

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

const sameDay = (a: Date | null, b: Date) =>
  !!a &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const chunk = <T,>(arr: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

type Cell = {
  date: Date;
  inMonth: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
  focused: boolean;
};

/**
 * DatePicker — date-picking calendar inspired by the jQuery UI DatePicker
 * interaction (month navigation, day grid, inline popup), but with
 * localization via `Intl` (months/days/headers come from the locale) instead
 * of manual patterns, and reactive to language changes.
 *
 * Supports two modes: `inline` (calendar always visible) and popup (read-only
 * input that opens the calendar on click). Implements the `Field` contract
 * (via `createControlField`), so it integrates with `Form` and validators
 * like any other field.
 *
 * Grid keyboard: arrows (day/week), PageUp/PageDown (month),
 * Shift+PageUp/PageDown (year), Home/End (first/last of month),
 * Ctrl+Home/End (first/last of year), Enter (select), Esc (close).
 */
export const DatePicker = (props: DatePickerOptions): DatePickerField => {
  const { div, label, input, table, thead, tbody, tr, th, td, button, p } = van.tags;

  const name = props.name ?? "date";
  const firstDow = (((props.firstDayOfWeek ?? 1) % 7) + 7) % 7;
  const inline = props.inline === true;
  const disabled = asState(props.disabled, false);

  // Selection: accepts an external State (two-way) or an internal one.
  const selected =
    typeof props.value === "object" && props.value !== null && "val" in props.value
      ? (props.value as State<Date | null>)
      : van.state<Date | null>((props.value as Date | null) ?? null);

  const today = toDateOnly(new Date());
  // Reactive bounds: accept Date or State<Date | null> and re-evaluate on mutation.
  // Note: do not use asState here (a Date is also an object and would be mistaken for a State).
  const minState =
    typeof props.min === "object" && props.min !== null && "val" in props.min
      ? (props.min as State<Date | null>)
      : van.state<Date | null>((props.min as Date | null) ?? null);
  const maxState =
    typeof props.max === "object" && props.max !== null && "val" in props.max
      ? (props.max as State<Date | null>)
      : van.state<Date | null>((props.max as Date | null) ?? null);

  const viewYear = van.state(selected.val ? selected.val.getFullYear() : today.getFullYear());
  const viewMonth = van.state(selected.val ? selected.val.getMonth() : today.getMonth());
  const open = van.state(false);
  const focused = van.state<Date>(selected.val ?? today);

  let containerEl: HTMLElement | null = null;

  const requiredMsg: ValidatorMessage = props.requiredMsg ?? t("datepicker.required", "Please select a date");
  const validators: Validator[] = props.required ? [Required(requiredMsg)] : [];

  // --- Reactive localization (Intl): date data, not translation keys ---
  const monthTitle = van.derive(() => {
    const s = new Intl.DateTimeFormat(i18n.currentLocale.val, {
      month: "long",
      year: "numeric",
    }).format(new Date(viewYear.val, viewMonth.val, 1));
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  const weekdayCols = van.derive(() => {
    const fmt = new Intl.DateTimeFormat(i18n.currentLocale.val, { weekday: "short" });
    const byDow: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2021, 0, 3 + i); // 2021-01-03 is a Sunday (getDay 0)
      byDow[d.getDay()] = fmt.format(d);
    }
    const cols: string[] = [];
    for (let c = 0; c < 7; c++) cols.push(byDow[(firstDow + c) % 7]);
    return cols;
  });

  const cells = van.derive(() => {
    const y = viewYear.val;
    const m = viewMonth.val;
    const first = new Date(y, m, 1);
    const offset = (first.getDay() - firstDow + 7) % 7;
    const start = new Date(y, m, 1 - offset);
    const count = Math.ceil((offset + daysInMonth(y, m)) / 7) * 7;
    const minD = minState.val ? toDateOnly(minState.val) : undefined;
    const maxD = maxState.val ? toDateOnly(maxState.val) : undefined;
    const list: Cell[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const within = !(minD && d < minD) && !(maxD && d > maxD);
      list.push({
        date: d,
        inMonth: d.getMonth() === m,
        today: sameDay(today, d),
        selected: sameDay(selected.val, d),
        disabled: !within,
        focused: sameDay(focused.val, d),
      });
    }
    return list;
  });

  const display = van.derive(() => {
    const s = selected.val;
    if (!s) return "";
    return new Intl.DateTimeFormat(i18n.currentLocale.val, { dateStyle: "medium" }).format(s);
  });

  // Labels as top-level derives: renderCalendar() must NOT read reactive
  // states directly (raw() captures currentLocale/revision as deps of the
  // outer binding `() => renderCalendar()` and every language change would
  // rebuild the whole calendar — the grid's inner binding ends up anchored
  // to a detached table and bindings accumulate until they steal the live
  // table: empty calendar after switching language). With top-level
  // derives the outer binding has no deps: it runs ONCE on mount.
  const prevMonthLabel = van.derive(() => raw("datepicker.prevMonth", "Previous month"));
  const nextMonthLabel = van.derive(() => raw("datepicker.nextMonth", "Next month"));
  const todayLabel = van.derive(() => raw("datepicker.today", "Today"));

  const longDateLabel = (d: Date) =>
    new Intl.DateTimeFormat(i18n.currentLocale.val, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);

  // --- Navigation and selection ---
  const syncViewTo = (d: Date) => {
    viewYear.val = d.getFullYear();
    viewMonth.val = d.getMonth();
  };

  const changeMonth = (delta: number) => {
    let m = viewMonth.val + delta;
    let y = viewYear.val;
    while (m < 0) {
      m += 12;
      y--;
    }
    while (m > 11) {
      m -= 12;
      y++;
    }
    viewMonth.val = m;
    viewYear.val = y;
  };

  const select = (d: Date) => {
    if (readState(disabled, false)) return;
    const minD = minState.val ? toDateOnly(minState.val) : undefined;
    const maxD = maxState.val ? toDateOnly(maxState.val) : undefined;
    if (minD && d < minD) return;
    if (maxD && d > maxD) return;
    selected.val = toDateOnly(d);
    syncViewTo(selected.val);
    focused.val = selected.val;
    field.isTouched.val = true;
    field.validate();
    if (!inline) setOpen(false);
  };

  const goToToday = () => {
    selected.val = toDateOnly(new Date());
    syncViewTo(selected.val);
    focused.val = selected.val;
    field.isTouched.val = true;
    field.validate();
    if (!inline) setOpen(false);
  };

  const setOpen = (v: boolean) => {
    if (open.val === v) return;
    open.val = v;
    if (typeof document === "undefined") return;
    if (v) {
      if (selected.val) syncViewTo(selected.val);
      document.addEventListener("click", onDocClick);
    } else {
      document.removeEventListener("click", onDocClick);
    }
  };

  const onDocClick = (e: MouseEvent) => {
    if (containerEl && !containerEl.contains(e.target as Node)) setOpen(false);
  };

  const moveFocus = (dy: number, dx: number) => {
    const cur = focused.val;
    const next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + dx + dy * 7);
    if (next.getMonth() !== viewMonth.val) syncViewTo(next);
    focused.val = next;
  };

  const addMonthsClamped = (d: Date, delta: number): Date => {
    const total = d.getMonth() + delta;
    const y = d.getFullYear() + Math.floor(total / 12);
    const m = ((total % 12) + 12) % 12;
    return new Date(y, m, Math.min(d.getDate(), daysInMonth(y, m)));
  };

  const gotoDay = (d: Date) => {
    if (d.getMonth() !== viewMonth.val || d.getFullYear() !== viewYear.val) syncViewTo(d);
    focused.val = d;
  };

  const handleGridKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(0, -1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveFocus(0, 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocus(1, 0);
        break;
      case "PageUp":
        e.preventDefault();
        gotoDay(addMonthsClamped(focused.val, e.shiftKey ? -12 : -1));
        break;
      case "PageDown":
        e.preventDefault();
        gotoDay(addMonthsClamped(focused.val, e.shiftKey ? 12 : 1));
        break;
      case "Home":
        e.preventDefault();
        gotoDay(e.ctrlKey ? new Date(viewYear.val, 0, 1) : new Date(viewYear.val, viewMonth.val, 1));
        break;
      case "End":
        e.preventDefault();
        gotoDay(
          e.ctrlKey
            ? new Date(viewYear.val, 11, 31)
            : new Date(viewYear.val, viewMonth.val, daysInMonth(viewYear.val, viewMonth.val)),
        );
        break;
      case "Enter":
        e.preventDefault();
        select(focused.val);
        break;
      case "Escape":
        if (!inline) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        if (!inline) setOpen(false);
        break;
    }
  };

  const handleInputKeydown = (e: KeyboardEvent) => {
    if (readState(disabled, false)) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  const cellClass = (cell: Cell) =>
    cx(
      "h-9 w-9 rounded-full text-sm transition-colors",
      cell.disabled
        ? "opacity-30 cursor-not-allowed hover:bg-transparent"
        : cell.selected
          ? "bg-primary text-white font-semibold"
          : cell.today
            ? "font-semibold border border-accent text-accent hover:bg-secondary"
            : cell.focused
              ? "bg-secondary/30 text-foreground"
              : "text-foreground hover:bg-secondary",
      !cell.inMonth && !cell.selected ? "text-muted/60" : "",
    );

  // The grid is a single reactive node: rebuilt when cells or locale mutate.
  const grid = van.derive(() =>
    table(
      { class: "w-full border-collapse text-center" },
      thead(
        tr(
          ...weekdayCols.val.map((w) =>
            th({ class: "text-xs font-medium text-muted py-1 w-9" }, w),
          ),
        ),
      ),
      tbody(
        ...chunk(cells.val, 7).map((row) =>
          tr(
            ...row.map((cell) =>
              td(
                button(
                  {
                    type: "button",
                    "aria-label": longDateLabel(cell.date),
                    "data-date": iso(cell.date),
                    ...(cell.disabled ? { disabled: true } : {}),
                    class: cellClass(cell),
                    onclick: () => select(cell.date),
                  },
                  cell.date.getDate(),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  const renderCalendar = () =>
    div(
      {
        class: "p-3 w-72",
        tabindex: 0,
        onkeydown: handleGridKeydown,
      },
      div(
        { class: "flex items-center justify-between mb-2" },
        button(
          {
            type: "button",
            class:
              "h-8 w-8 flex items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground cursor-pointer text-lg leading-none",
            "aria-label": () => prevMonthLabel.val,
            onclick: () => changeMonth(-1),
          },
          "‹",
        ),
        div({ class: "font-semibold text-foreground text-sm" }, () => monthTitle.val),
        button(
          {
            type: "button",
            class:
              "h-8 w-8 flex items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground cursor-pointer text-lg leading-none",
            "aria-label": () => nextMonthLabel.val,
            onclick: () => changeMonth(1),
          },
          "›",
        ),
      ),
      () => grid.val,
      div(
        { class: "mt-2 flex justify-end" },
        button(
          {
            type: "button",
            class:
              "px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-foreground hover:bg-primary/10 cursor-pointer",
            onclick: goToToday,
          },
          () => todayLabel.val,
        ),
      ),
    );

  const dom = () => {
    const errorText = van.derive(() =>
      field.isInvalid.val || (field.isTouched.val && !!field.error.val) ? field.error.val : "",
    );
    const inputCls = van.derive(() =>
      cx(
        "w-full px-3 py-2 border rounded-md text-sm transition-colors text-left focus:outline-none focus:ring-2",
        field.isInvalid.val
          ? "border-destructive focus:ring-destructive/30"
          : "border-border focus:ring-accent/30 focus:border-accent",
        disabled.val ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ),
    );

    containerEl = div(
      {
        class: () => cx("field datepicker relative flex flex-col gap-1", field.stateClass.val, props.class),
      },
      props.label
        ? label({ class: "font-medium text-foreground", for: name }, props.label)
        : null,
      input({ type: "hidden", name, value: () => iso(selected.val) }),
      inline
        ? null
        : input({
            id: name,
            type: "text",
            readOnly: true,
            class: inputCls,
            value: () => display.val,
            placeholder: props.placeholder ?? t("datepicker.placeholder", "Select a date"),
            disabled: () => disabled.val,
            onfocus: () => setOpen(true),
            onclick: () => setOpen(true),
            onkeydown: handleInputKeydown,
          }),
      inline
        ? renderCalendar()
        : div(
            {
              class: () =>
                cx(
                  "datepicker-popup absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-background shadow-xl",
                  open.val ? "" : "hidden",
                ),
            },
            () => renderCalendar(),
          ),
      p(
        { class: () => (errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden") },
        () => errorText.val,
      ),
    );
    return containerEl;
  };

  const field = createControlField(
    {
      name,
      value: van.derive(() => iso(selected.val)),
      currentValue: () => iso(selected.val),
      applyValue: (rawStr) => {
        const d = parseIso(rawStr);
        if (d) {
          selected.val = d;
          syncViewTo(d);
          focused.val = d;
        }
      },
    },
    { dom },
    validators,
  );
  return field;
};
