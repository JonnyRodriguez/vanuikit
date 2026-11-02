import van, { type State } from "vanjs-core";
import type { Validator, ValidatorMessage } from "../validators.js";
import { Required } from "../validators.js";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import { asState, createControlField, type ControlField } from "./checkable.js";
import type { CheckSize, ToggleText } from "./checkbox.js";

export interface SwitchOptions {
  name?: string;
  label?: ToggleText;
  description?: ToggleText;
  checked?: boolean | State<boolean>;
  disabled?: boolean | State<boolean>;
  size?: CheckSize;
  /** Required: error on submit while off (integration with `Form`). */
  required?: boolean;
  requiredMsg?: ToggleText;
  class?: string;
  [key: string]: any;
}

export interface SwitchField
  extends ControlField<{ readonly checked: State<boolean>; dom(): HTMLElement }> {}

const TRACK_SIZES: Record<CheckSize, { track: string; thumb: string; on: string; labelSize: string; desc: string }> = {
  sm: { track: "w-8 h-4", thumb: "w-3 h-3", on: "translate-x-4", labelSize: "text-xs", desc: "text-[10px]" },
  md: { track: "w-10 h-5", thumb: "w-4 h-4", on: "translate-x-5", labelSize: "text-sm", desc: "text-xs" },
  lg: { track: "w-12 h-6", thumb: "w-5 h-5", on: "translate-x-6", labelSize: "text-base", desc: "text-sm" },
};

/**
 * Accessible switch (`role="switch"` on a native input): Space toggles it and
 * screen readers announce it as a switch. `checked`
 * accepts an external State for two-way binding; with `required`/`name`
 * it integrates with `Form`.
 */
export const Switch = (options: SwitchOptions = {}): SwitchField => {
  const { div, label, input, p, span } = van.tags;

  const name = options.name ?? "switch";
  const sizes = TRACK_SIZES[options.size ?? "md"];
  const checked = asState(options.checked, false);
  const disabled = asState(options.disabled, false);
  const focused = van.state(false);

  const value = van.derive(() => (checked.val ? "on" : ""));
  const requiredMsg: ValidatorMessage = options.requiredMsg ?? t("switch.required", "You must turn this option on");
  const validators: Validator[] = options.required ? [Required(requiredMsg)] : [];

  let field!: SwitchField;

  const dom = () => {
    const trackClass = van.derive(() =>
      cx(
        "flex shrink-0 items-center rounded-full px-0.5 transition-colors",
        sizes.track,
        focused.val ? "ring-2 ring-accent/40" : "",
        checked.val ? "bg-accent" : "bg-border",
        disabled.val ? "opacity-50 cursor-not-allowed" : "",
      ),
    );
    const thumbClass = van.derive(() =>
      cx("rounded-full bg-white shadow transition-transform", sizes.thumb, checked.val ? sizes.on : ""),
    );
    const errorText = van.derive(() =>
      field.isInvalid.val || (field.isTouched.val && !!field.error.val) ? field.error.val : "",
    );

    const inputAttrs: Record<string, any> = {
      type: "checkbox",
      role: "switch",
      id: name,
      name,
      class: "sr-only",
      checked: () => checked.val,
      disabled: () => disabled.val,
      "aria-invalid": () => (field.isInvalid.val ? "true" : "false"),
      onchange: (e: Event) => {
        checked.val = (e.target as HTMLInputElement).checked;
        if (field.isTouched.val) field.validate();
      },
      onfocus: () => {
        focused.val = true;
      },
      onblur: () => {
        focused.val = false;
        field.isTouched.val = true;
        field.validate();
      },
    };
    if (options.description) inputAttrs["aria-describedby"] = `${name}-description`;

    return div(
      { class: () => cx("field flex flex-col gap-1", field.stateClass.val, options.class) },
      label(
        {
          class: () =>
            cx("flex items-center gap-2.5", disabled.val ? "cursor-not-allowed" : "cursor-pointer"),
        },
        input(inputAttrs),
        span({ class: trackClass, "aria-hidden": "true" }, span({ class: thumbClass })),
        span(
          { class: "flex flex-col" },
          options.label !== undefined
            ? span({ class: () => cx(sizes.labelSize, "font-medium text-foreground") }, options.label)
            : null,
          options.description
            ? span(
                { id: `${name}-description`, class: () => cx(sizes.desc, "text-foreground-soft") },
                options.description,
              )
            : null,
        ),
      ),
      p(
        { class: () => (errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden") },
        () => errorText.val,
      ),
    );
  };

  field = createControlField(
    {
      name,
      value,
      currentValue: () => (checked.val ? "on" : ""),
      applyValue: (rawStr) => {
        checked.val = rawStr !== "";
      },
    },
    { checked, dom },
    validators,
  );
  return field;
};
