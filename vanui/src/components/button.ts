import van, { type ChildDom } from "vanjs-core";
import { cx } from "../util.js";

const BASE_CLASSES =
  "font-semibold w-full rounded-md transition duration-200 ease-in-out cursor-pointer border border-transparent";

/** Variantes de color del botón (tokens semánticos del tema). */
const VARIANT_CLASSES = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active shadow-primary-shadow",
  secondary:
    "bg-secondary text-secondary-fg hover:bg-secondary-hover active:bg-secondary-active",
  destructive:
    "bg-destructive text-white hover:opacity-90 active:opacity-80",
} as const;

/** Tamaños estándar (bootstrap/shadcn-like). */
const SIZE_CLASSES = {
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;
export type ButtonSize = keyof typeof SIZE_CLASSES;

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  class?: string;
  type?: "button" | "submit" | "reset";
  [key: string]: any;
};

/**
 * Botón unificado. `variant` y `size` son opcionales (defaults: primary, md).
 * `type` por defecto es "button" para no provocar submits accidentales:
 * pasa type: "submit" cuando vaya dentro de un Form.
 */
export const Button = (
  props: ButtonProps = {},
  ...children: ChildDom[]
) => {
  const {
    class: extra,
    type = "button",
    variant = "primary",
    size = "md",
    ...rest
  } = props;
  return van.tags.button(
    {
      ...rest,
      type,
      class: cx(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        extra,
      ),
    },
    ...children,
  );
};

// Wrappers de compatibilidad con la API anterior.
export const PrimaryButton = (props: ButtonProps = {}, ...children: ChildDom[]) =>
  Button({ ...props, variant: "primary" }, ...children);

export const SecondaryButton = (props: ButtonProps = {}, ...children: ChildDom[]) =>
  Button({ ...props, variant: "secondary" }, ...children);
