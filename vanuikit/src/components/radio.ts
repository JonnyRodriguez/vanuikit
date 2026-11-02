import van, { type State } from "vanjs-core";
import type { Validator, ValidatorMessage } from "../validators.js";
import { Required } from "../validators.js";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import { asState, createControlField, readState, type ControlField } from "./checkable.js";
import type { CheckSize, ToggleText } from "./checkbox.js";

export interface RadioOption {
  value: string;
  label: ToggleText;
  description?: ToggleText;
  disabled?: boolean | State<boolean>;
}

export interface RadioGroupOptions {
  name?: string;
  options: RadioOption[];
  /** Valor seleccionado; acepta State externo para enlace bidireccional. */
  value?: string | State<string>;
  size?: CheckSize;
  /** Etiqueta accesible del grupo (aria-label del contenedor). */
  ariaLabel?: ToggleText;
  disabled?: boolean | State<boolean>;
  /** Requerido: error al enviar sin selección (integración con `Form`). */
  required?: boolean;
  requiredMsg?: ToggleText;
  class?: string;
  [key: string]: any;
}

export interface RadioGroupField extends ControlField<{ dom(): HTMLElement }> {}

const DOT_SIZES: Record<CheckSize, { box: string; dot: string; labelSize: string; desc: string; offset: string }> = {
  sm: { box: "size-3.5 rounded-full", dot: "size-1.5", labelSize: "text-xs", desc: "text-[10px]", offset: "mt-0.5" },
  md: { box: "size-4 rounded-full", dot: "size-2", labelSize: "text-sm", desc: "text-xs", offset: "mt-0.5" },
  lg: { box: "size-5 rounded-full", dot: "size-2.5", labelSize: "text-base", desc: "text-sm", offset: "mt-1" },
};

/**
 * Grupo de radios excluyentes y accesible (`role="radiogroup"`): flechas
 * ↑/↓/←/→ mueven la selección entre opciones habilitadas (roving focus),
 * Tab entra y sale del grupo. Con `required`/`name` se integra a `Form`.
 */
export const RadioGroup = (options: RadioGroupOptions): RadioGroupField => {
  const { div, label, input, p, span } = van.tags;

  const name = options.name ?? "radio";
  const sizes = DOT_SIZES[options.size ?? "md"];
  const selected = asState(options.value, "");
  const groupDisabled = asState(options.disabled, false);
  const focusedValue = van.state("");

  const requiredMsg: ValidatorMessage = options.requiredMsg ?? t("radio.required", "Please select an option");
  const validators: Validator[] = options.required ? [Required(requiredMsg)] : [];

  const control = createControlField(
    {
      name,
      value: selected,
      currentValue: () => selected.val,
      applyValue: (rawStr) => {
        selected.val = rawStr;
      },
    },
    validators,
  );

  let field!: RadioGroupField;

  const dom = () => {
    const inputByName = new Map<string, HTMLInputElement>();
    const isEnabled = (o: RadioOption) =>
      !(groupDisabled.val || readState(o.disabled, false));

    const errorText = van.derive(() =>
      field.isInvalid.val || (field.isTouched.val && !!field.error.val) ? field.error.val : "",
    );

    const items = options.options.map((o) => {
      const enabled = van.derive(() => isEnabled(o));
      const boxClass = van.derive(() =>
        cx(
          "flex shrink-0 items-center justify-center border transition-colors",
          sizes.box,
          sizes.offset,
          focusedValue.val === o.value ? "ring-2 ring-accent/40 border-accent" : "",
          selected.val === o.value ? "bg-accent border-accent" : "bg-card border-border",
          enabled.val ? "" : "opacity-50",
        ),
      );
      const dotClass = van.derive(() => (selected.val === o.value ? "opacity-100" : "opacity-0"));

      const inputAttrs: Record<string, any> = {
        type: "radio",
        id: `${name}-${o.value}`,
        name,
        value: o.value,
        class: "sr-only",
        checked: () => selected.val === o.value,
        disabled: () => !enabled.val,
        "aria-invalid": () => (field.isInvalid.val ? "true" : "false"),
        onchange: (e: Event) => {
          if ((e.target as HTMLInputElement).checked && isEnabled(o)) {
            selected.val = o.value;
            if (field.isTouched.val) field.validate();
          }
        },
        onfocus: () => {
          focusedValue.val = o.value;
        },
        onblur: () => {
          if (focusedValue.val === o.value) focusedValue.val = "";
          field.isTouched.val = true;
          field.validate();
        },
        onkeydown: (e: KeyboardEvent) => {
          const dir =
            e.key === "ArrowDown" || e.key === "ArrowRight" ? 1
            : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1
            : 0;
          if (!dir) return;
          e.preventDefault();
          const selectable = options.options.filter((x) => isEnabled(x));
          if (!selectable.length) return;
          // El ancla del roving es la opción enfocada (o la seleccionada si
          // el grupo no tuvo foco); sin ancla válida, se entra por el extremo.
          const anchor = focusedValue.val || selected.val;
          const cur = selectable.findIndex((x) => x.value === anchor);
          const next = cur === -1
            ? selectable[dir === 1 ? 0 : selectable.length - 1]
            : selectable[(cur + dir + selectable.length) % selectable.length];
          selected.val = next.value;
          inputByName.get(next.value)?.focus();
        },
      };

      const inputEl = input(inputAttrs);
      inputByName.set(o.value, inputEl);

      return label(
        { class: () => cx("flex items-start gap-2.5", enabled.val ? "cursor-pointer" : "cursor-not-allowed") },
        inputEl,
        span(
          { class: boxClass, "aria-hidden": "true" },
          span({ class: () => cx(sizes.dot, "rounded-full bg-white transition-opacity", dotClass.val) }),
        ),
        span(
          { class: "flex flex-col" },
          span({ class: () => cx(sizes.labelSize, "font-medium text-foreground") }, o.label),
          o.description
            ? span({ class: () => cx(sizes.desc, "text-foreground-soft") }, o.description)
            : null,
        ),
      );
    });

    const groupAttrs: Record<string, any> = {
      role: "radiogroup",
      class: () => cx("field radio-group flex flex-col gap-2", field.stateClass.val, options.class),
    };
    if (options.ariaLabel !== undefined) groupAttrs["aria-label"] = options.ariaLabel;

    return div(
      groupAttrs,
      ...items,
      p(
        { class: () => (errorText.val ? "field-error text-xs text-destructive mt-0.5" : "hidden") },
        () => errorText.val,
      ),
    );
  };

  field = createControlField(
    {
      name,
      value: selected,
      currentValue: () => selected.val,
      applyValue: (rawStr) => {
        selected.val = rawStr;
      },
    },
    { dom },
    validators,
  );
  return field;
};
