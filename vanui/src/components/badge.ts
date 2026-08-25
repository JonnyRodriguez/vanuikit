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

  const variantStyles: Record<BadgeVariant, string> = {
    primary: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    secondary: "bg-slate-700/50 text-slate-300 border border-slate-600/30",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    outline: "bg-transparent text-slate-300 border border-slate-600",
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary: "bg-blue-400",
    secondary: "bg-slate-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    outline: "bg-slate-400",
  };

  return span(
    {
      id: props.id,
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
