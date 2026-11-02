import van, { type ChildDom } from "vanjs-core";
import { cx } from "../util.js";

const BASE_CLASSES =
  "font-semibold rounded-md transition duration-200 ease-in-out cursor-pointer border border-transparent";

/** Button color variants (theme semantic tokens). Exported for reuse (e.g. Link variant "button"). */
export const VARIANT_CLASSES = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active shadow-primary-shadow",
  secondary:
    "bg-secondary text-secondary-fg hover:bg-secondary-hover active:bg-secondary-active",
  destructive:
    "bg-destructive text-white hover:opacity-90 active:opacity-80",
} as const;

/** Standard sizes (bootstrap/shadcn-like). Exported for reuse (e.g. Link variant "button"). */
export const SIZE_CLASSES = {
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;
export type ButtonSize = keyof typeof SIZE_CLASSES;

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width (w-full): opt-in, useful in forms. Default: auto width. */
  block?: boolean;
  class?: string;
  type?: "button" | "submit" | "reset";
  [key: string]: any;
};

/**
 * Unified button. `variant` and `size` are optional (defaults: primary, md).
 * `type` defaults to "button" to avoid accidental submits:
 * pass type: "submit" when it goes inside a Form.
 * Auto width by default; `block: true` for w-full (forms, row CTAs).
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
    block = false,
    ...rest
  } = props;
  return van.tags.button(
    {
      ...rest,
      type,
      class: cx(
        BASE_CLASSES,
        block && "w-full",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        extra,
      ),
    },
    ...children,
  );
};

// Compatibility wrappers for the previous API.
export const PrimaryButton = (props: ButtonProps = {}, ...children: ChildDom[]) =>
  Button({ ...props, variant: "primary" }, ...children);

export const SecondaryButton = (props: ButtonProps = {}, ...children: ChildDom[]) =>
  Button({ ...props, variant: "secondary" }, ...children);
