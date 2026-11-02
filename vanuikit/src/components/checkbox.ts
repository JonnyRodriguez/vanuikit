import van, { type State } from "vanjs-core";
import type { Validator, ValidatorMessage } from "../validators.js";
import { Required } from "../validators.js";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import { asState, createControlField, type ControlField } from "./checkable.js";
import { Svg, SvgPath } from "./svg.js";

export type ToggleText = string | State<string>;
export type CheckSize = "sm" | "md" | "lg";

export interface CheckboxOptions {
  name?: string;
  label?: ToggleText;
  description?: ToggleText;
  checked?: boolean | State<boolean>;
  indeterminate?: boolean | State<boolean>;
  disabled?: boolean | State<boolean>;
  size?: CheckSize;
  /** Requerido: error al enviar sin marcar (integración con `Form`). */
  required?: boolean;
  requiredMsg?: ToggleText;
  class?: string;
  [key: string]: any;
}

export interface CheckboxField
  extends ControlField<{ readonly checked: State<boolean>; dom(): HTMLElement }> {}

const BOX_SIZES: Record<CheckSize, { box: string; icon: string; labelSize: string; desc: string; offset: string }> = {
  sm: { box: "size-3.5 rounded", icon: "w-2.5", labelSize: "text-xs", desc: "text-[10px]", offset: "mt-0.5" },
  md: { box: "size-4 rounded", icon: "w-3", labelSize: "text-sm", desc: "text-xs", offset: "mt-0.5" },
  lg: { box: "size-5 rounded-md", icon: "w-3.5", labelSize: "text-base", desc: "text-sm", offset: "mt-1" },
};

/**
 * Checkbox accesible (input nativo + caja estilizada): Space lo alterna,
 * el click en label/description también. `checked` acepta un State externo
 * para enlace bidireccional. Con `required`/`name` se integra a `Form`.
 */
export const Checkbox = (options: CheckboxOptions = {}): CheckboxField => {
  const { div, label, input, p, span } = van.tags;

  const name = options.name ?? "checkbox";
  const sizes = BOX_SIZES[options.size ?? "md"];
  const checked = asState(options.checked, false);
  const indeterminate = asState(options.indeterminate, false);
  const disabled = asState(options.disabled, false);
  const focused = van.state(false);

  const value = van.derive(() => (checked.val ? "on" : ""));
  const requiredMsg: ValidatorMessage = options.requiredMsg ?? t("checkbox.required", "You must check this option");
  const validators: Validator[] = options.required ? [Required(requiredMsg)] : [];

  let field!: CheckboxField;

  const dom = () => {
    const boxClass = van.derive(() =>
      cx(
        "flex shrink-0 items-center justify-center border transition-colors",
        sizes.box,
        sizes.offset,
        focused.val ? "ring-2 ring-accent/40 border-accent" : "",
        checked.val || indeterminate.val
          ? "bg-accent border-accent text-white"
          : "bg-card border-border",
        disabled.val ? "opacity-50 cursor-not-allowed" : "",
      ),
    );
    const checkClass = van.derive(() =>
      checked.val && !indeterminate.val ? "opacity-100" : "opacity-0",
    );
    const dashClass = van.derive(() =>
      indeterminate.val && !checked.val ? "opacity-100" : "opacity-0",
    );
    const errorText = van.derive(() =>
      field.isInvalid.val || (field.isTouched.val && !!field.error.val) ? field.error.val : "",
    );

    const inputAttrs: Record<string, any> = {
      type: "checkbox",
      id: name,
      name,
      class: "sr-only",
      checked: () => checked.val,
      indeterminate: () => indeterminate.val,
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
            cx("flex items-start gap-2.5", disabled.val ? "cursor-not-allowed" : "cursor-pointer"),
        },
        input(inputAttrs),
        span(
          { class: boxClass, "aria-hidden": "true" },
          Svg(
            {
              viewBox: "0 0 12 12",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
            },
            SvgPath({ d: "M2.5 6.5 5 9 9.5 3", class: checkClass }),
            SvgPath({ d: "M2.5 6h7", class: dashClass }),
          ),
        ),
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
