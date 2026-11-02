import van, { type State } from "vanjs-core";

const { span } = van.tags;

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  id?: string;
  text?: string | number | State<string | number>;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  class?: string;
  children?: any;
}

export function Badge(props: BadgeProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  /** Theme semantic tokens (--vui-*): -fg text (readable in both
   *  modes, ≥ 4.5:1 over the 10% tint) and base for background/border/dot. */
  const variantStyles: Record<BadgeVariant, string> = {
    primary: "bg-accent/10 text-accent-fg border border-accent/20",
    secondary: "bg-secondary/20 text-foreground-soft border border-secondary/30",
    success: "bg-success/10 text-success-fg border border-success/20",
    warning: "bg-warning/10 text-warning-fg border border-warning/20",
    danger: "bg-destructive/10 text-destructive-fg border border-destructive/20",
    outline: "bg-transparent text-foreground-soft border border-border",
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary: "bg-accent",
    secondary: "bg-muted",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    outline: "bg-muted",
  };

  return span(
    {
      ...(props.id ? { id: props.id } : {}),
      class: `inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${props.class ?? ""}`,
    },
    props.dot
      ? span({
          class: `w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`,
        })
      : null,
    props.text !== undefined ? props.text : null,
    props.children,
  );
}
