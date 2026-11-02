import van, { type State } from "vanjs-core";
import type { Validator, ValidatorMessage } from "../validators.js";
import { Required } from "../validators.js";
import { raw, t } from "../i18n.js";
import { cx } from "../util.js";
import { asState, createControlField, readState, type ControlField } from "./checkable.js";
import type { ToggleText } from "./checkbox.js";

export interface ComboboxOption {
  value: string;
  label: ToggleText;
  disabled?: boolean | State<boolean>;
}

export interface ComboboxOptions {
  options: ComboboxOption[];
  name?: string;
  /**
   * Selected value; accepts an external State for two-way binding.
   * With `multiple: true` it must be `State<string[]>`.
   */
  value?: string | State<string> | State<string[]>;
  /** Multi-select mode: removable chips; the panel does not close on pick. */
  multiple?: boolean;
  /** Input placeholder (default: "Search..."). */
  placeholder?: ToggleText;
  disabled?: boolean | State<boolean>;
  /** Required: error on submit with no selection (integration with `Form`). */
  required?: boolean;
  requiredMsg?: ToggleText;
  class?: string;
  [key: string]: any;
}

export interface ComboboxField extends ControlField<{ dom(): HTMLElement }> {}

let nextId = 0;

const labelOf = (opt: ComboboxOption): string =>
  typeof opt.label === "object" ? (opt.label.val ?? "") : opt.label;

/**
 * Full WAI-ARIA Combobox (unlike SelectDropdown, which is a button select):
 * the input filters as you type and owns the whole keyboard
 * — ↑/↓ navigate, Home/End jump, Enter selects, Esc closes — with
 * `aria-activedescendant` over the listbox. Click outside closes. With
 * `required`/`name` it integrates with `Form` (Field contract).
 *
 * With `multiple: true` the selection shows as removable chips (click
 * on × or Backspace with an empty input), picking does not close the panel
 * and the expected `value` is `State<string[]>`. Form limitation: `FormData`
 * collapses repeated values, so in multiple mode use `field.value.val` to
 * read the full selection.
 */
export const Combobox = (props: ComboboxOptions): ComboboxField => {
  const { div, input, ul, li, p, span, button } = van.tags;

  const name = props.name ?? "combobox";
  const uid = `vanuikit-combobox-${nextId++}`;
  const listboxId = `${uid}-listbox`;
  const multi = props.multiple === true;
  const selected = asState(props.value as string | State<string> | undefined, "");
  const selectedMulti = asState(props.value as State<string[]> | undefined, [] as string[]);
  const query = van.state("");
  const open = van.state(false);
  const focusedIdx = van.state(-1);
  const disabled = asState(props.disabled, false);
  let containerEl: HTMLElement | null = null;
  let textInputEl: HTMLInputElement | null = null;

  const requiredMsg: ValidatorMessage =
    props.requiredMsg ?? t("radio.required", "Please select an option");
  const validators: Validator[] = props.required ? [Required(requiredMsg)] : [];

  const selectedLabel = van.derive(() => {
    const opt = props.options.find((o) => o.value === selected.val);
    return opt ? labelOf(opt) : "";
  });
  // Single: closed shows the selection; open, what is typed.
  // Multi: the selection lives in the chips — the input always shows the query.
  const display = van.derive(() =>
    multi ? query.val : open.val ? query.val : selectedLabel.val,
  );
  const filtered = van.derive(() => {
    const q = query.val.trim().toLowerCase();
    return q
      ? props.options.filter((o) => labelOf(o).toLowerCase().includes(q))
      : props.options;
  });
  const enabledIdxs = van.derive(() => {
    const fs = filtered.val;
    const idxs: number[] = [];
    fs.forEach((o, i) => !readState(o.disabled, false) && idxs.push(i));
    return idxs;
  });

  const clampFocus = () => {
    const max = enabledIdxs.val.length - 1;
    if (focusedIdx.val > max) focusedIdx.val = max;
  };

  const setOpen = (v: boolean) => {
    if (open.val === v) return;
    open.val = v;
    if (typeof document === "undefined") return;
    if (v) {
      document.addEventListener("click", onDocClick);
    } else {
      document.removeEventListener("click", onDocClick);
      query.val = "";
      focusedIdx.val = -1;
    }
  };

  const onDocClick = (e: MouseEvent) => {
    if (containerEl && !containerEl.contains(e.target as Node)) setOpen(false);
  };

  const moveFocus = (dir: 1 | -1 | "first" | "last") => {
    const enabled = enabledIdxs.val;
    if (!enabled.length) return;
    if (dir === "first") {
      focusedIdx.val = enabled[0];
    } else if (dir === "last") {
      focusedIdx.val = enabled[enabled.length - 1];
    } else {
      const cur = enabled.indexOf(focusedIdx.val);
      const next = cur === -1
        ? (dir === 1 ? enabled[0] : enabled[enabled.length - 1])
        : enabled[(cur + dir + enabled.length) % enabled.length];
      focusedIdx.val = next;
    }
  };

  const removeMulti = (value: string) => {
    selectedMulti.val = selectedMulti.val.filter((v) => v !== value);
    if (field.isTouched.val) field.validate();
  };

  const select = (opt: ComboboxOption) => {
    if (readState(opt.disabled, false)) return;
    field.isTouched.val = true;
    if (multi) {
      // Picking in multiple does not close: keep filtering/adding.
      if (selectedMulti.val.includes(opt.value)) {
        removeMulti(opt.value);
      } else {
        selectedMulti.val = [...selectedMulti.val, opt.value];
      }
      query.val = "";
    } else {
      selected.val = opt.value;
      setOpen(false);
    }
    field.validate();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (readState(disabled, false)) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open.val) {
          setOpen(true);
          focusedIdx.val = enabledIdxs.val[0] ?? -1;
        } else {
          moveFocus(1);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open.val) {
          setOpen(true);
          focusedIdx.val = enabledIdxs.val[enabledIdxs.val.length - 1] ?? -1;
        } else {
          moveFocus(-1);
        }
        break;
      case "Home":
        if (open.val) {
          e.preventDefault();
          moveFocus("first");
        }
        break;
      case "End":
        if (open.val) {
          e.preventDefault();
          moveFocus("last");
        }
        break;
      case "Enter":
        if (open.val && focusedIdx.val >= 0) {
          e.preventDefault();
          const opt = filtered.val[focusedIdx.val];
          if (opt) select(opt);
        }
        break;
      case "Backspace":
        // Multi: Backspace with an empty input removes the last chip.
        if (multi && query.val === "" && selectedMulti.val.length) {
          e.preventDefault();
          removeMulti(selectedMulti.val[selectedMulti.val.length - 1]);
        }
        break;
      case "Escape":
        if (open.val) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const optId = (i: number) => `${listboxId}-opt-${i}`;

  const dom = () => {
    const errorText = van.derive(() =>
      field.isInvalid.val || (field.isTouched.val && !!field.error.val) ? field.error.val : "",
    );

    const sharedInputAttrs = {
      type: "text",
      id: name,
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": () => (open.val ? "true" : "false"),
      "aria-controls": listboxId,
      "aria-activedescendant": () =>
        open.val && focusedIdx.val >= 0 ? optId(focusedIdx.val) : "",
      "aria-invalid": () => (field.isInvalid.val ? "true" : "false"),
      autocomplete: "off",
      value: () => display.val,
      placeholder: props.placeholder ?? t("dropdown.searchPlaceholder", "Search..."),
      disabled: () => disabled.val,
      oninput: (e: Event) => {
        query.val = (e.target as HTMLInputElement).value;
        if (!open.val) setOpen(true);
        focusedIdx.val = enabledIdxs.val[0] ?? -1;
      },
      onfocus: () => {
        setOpen(true);
        // When opened by focus with no prior option focus, the first enabled
        // one is ready for Enter.
        if (focusedIdx.val < 0) focusedIdx.val = enabledIdxs.val[0] ?? -1;
      },
      onkeydown: handleKeydown,
    };

    // The visible input shows the LABEL (single) or filters (multi); the real
    // value travels in a hidden input so FormData receives option.value.
    const triggerArea = multi
      ? div(
          {
            class: () =>
              cx(
                "flex w-full flex-wrap items-center gap-1.5 min-h-[2.625rem] px-2 py-1.5 border rounded-md text-sm transition-colors cursor-text",
                field.isInvalid.val
                  ? "border-destructive"
                  : "border-border focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent",
                disabled.val ? "opacity-50 cursor-not-allowed" : "",
              ),
            onclick: () => textInputEl?.focus(),
          },
          // Single anchor for the chips (internal children are regenerated).
          () =>
            div(
              { class: "contents" },
              ...selectedMulti.val.map((v) => {
                const opt = props.options.find((o) => o.value === v);
                const label = opt ? labelOf(opt) : v;
                return span(
                  {
                    class:
                      "flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
                  },
                  label,
                  button(
                    {
                      type: "button",
                      class: "cursor-pointer rounded-full hover:bg-primary/20 leading-none px-0.5",
                      "aria-label": raw("combobox.remove", "Remove {name}", { name: label }),
                      onclick: (e: MouseEvent) => {
                        e.stopPropagation();
                        removeMulti(v);
                      },
                    },
                    "×",
                  ),
                );
              }),
            ),
          input({
            ...sharedInputAttrs,
            class:
              "min-w-[6rem] flex-1 border-none bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-0",
          }),
        )
      : input({
          ...sharedInputAttrs,
          class: () =>
            cx(
              "w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2",
              field.isInvalid.val
                ? "border-destructive focus:ring-destructive/30"
                : "border-border focus:ring-accent/30 focus:border-accent",
              disabled.val ? "opacity-50 cursor-not-allowed" : "",
            ),
        });

    containerEl = div(
      { class: () => cx("field combobox relative flex flex-col gap-1", field.stateClass.val, props.class) },
      multi
        ? input({
            type: "hidden",
            name,
            value: () => selectedMulti.val.join(","),
          })
        : input({ type: "hidden", name, value: () => selected.val }),
      triggerArea,
      // Panel always mounted (real anchor); the whole ul is regenerated with
      // each filter pass (a single node per render: no function-children null).
      div(
        {
          class: () =>
            cx(
              "absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-background shadow-xl overflow-hidden",
              open.val ? "" : "hidden",
            ),
        },
        () => {
          clampFocus();
          const fs = filtered.val;
          return ul(
            {
              id: listboxId,
              role: "listbox",
              ...(multi ? { "aria-multiselectable": "true" } : {}),
              class: "max-h-60 overflow-y-auto py-1 list-none m-0",
            },
            fs.length === 0
              ? li(
                  { class: "px-3 py-4 text-xs text-center text-muted italic" },
                  t("dropdown.empty", "No results found"),
                )
              : fs.map((opt, i) => {
                  const isSelected = multi
                    ? selectedMulti.val.includes(opt.value)
                    : selected.val === opt.value;
                  const isFocused = focusedIdx.val === i;
                  const enabled = !readState(opt.disabled, false);
                  return li({
                    id: optId(i),
                    role: "option",
                    "aria-selected": isSelected ? "true" : "false",
                    ...(enabled ? {} : { "aria-disabled": "true" }),
                    class: cx(
                      "flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors",
                      !enabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                          ? "bg-primary/10 text-primary font-semibold"
                          : isFocused
                            ? "bg-secondary/20 text-foreground"
                            : "text-foreground hover:bg-secondary/15",
                    ),
                    onmousedown: (e: MouseEvent) => e.preventDefault(),
                    onclick: () => select(opt),
                    onmousemove: () => {
                      if (enabled && focusedIdx.val !== i) focusedIdx.val = i;
                    },
                  }, labelOf(opt));
                }),
          );
        },
      ),
      p(
        { class: () => (errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden") },
        () => errorText.val,
      ),
    );
    textInputEl = containerEl.querySelector('input[type="text"]');
    return containerEl;
  };

  const field = createControlField(
    {
      name,
      value: multi
        ? van.derive(() => selectedMulti.val.join(","))
        : (selected as State<string>),
      currentValue: () => (multi ? selectedMulti.val.join(",") : selected.val),
      applyValue: (rawStr) => {
        if (multi) {
          selectedMulti.val = rawStr ? rawStr.split(",") : [];
        } else {
          selected.val = rawStr;
        }
      },
    },
    { dom },
    validators,
  );
  return field;
};
