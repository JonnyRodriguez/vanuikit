import van, { type ChildDom, type State } from "vanjs-core";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export interface AvatarOptions {
  /** Name for the initials (and title/aria-label). Accepts a State. */
  name?: ToggleText;
  /** Image; if loading fails (or none given) the initials are shown. */
  src?: string;
  size?: AvatarSize;
  class?: string;
  [key: string]: any;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "w-8 h-8 text-xs",
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-14 h-14 text-base",
};

/**
 * Initials from a name: first letter of the first two words, or the
 * first two letters if there is only one. Shared with UserBadge.
 */
export const getInitials = (name: string, fallback = "?"): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback.slice(0, 2).toUpperCase() || "?";
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

/**
 * Avatar with initials fallback: shows the `src` image and, if loading
 * fails or none given, the initials of `name` over the primary color.
 */
export const Avatar = (props: AvatarOptions = {}): ChildDom => {
  const { div, img, span } = van.tags;
  const size = SIZE_CLASSES[props.size ?? "md"];
  const imgFailed = van.state(false);

  const readName = (): string =>
    typeof props.name === "object" ? ((props.name as State<string>).val ?? "") : (props.name ?? "");
  const displayName = van.derive(readName);
  const initials = van.derive(() => getInitials(readName()));

  return div(
    {
      class: () =>
        cx(
          "rounded-full bg-primary text-primary-fg font-bold flex items-center justify-center shrink-0 shadow-2xs select-none overflow-hidden",
          size,
          props.class,
        ),
      title: () => displayName.val,
      "aria-label": () => displayName.val,
      ...(props.onclick ? { onclick: props.onclick } : {}),
    },
    // Anchors always mounted: the parent toggles between image and initials
    // without any function-child returning null.
    () =>
      props.src && !imgFailed.val
        ? img({
            src: props.src,
            alt: () => displayName.val,
            class: "w-full h-full object-cover",
            onerror: () => (imgFailed.val = true),
          })
        : div(),
    span({ class: () => (props.src && !imgFailed.val ? "hidden" : "") }, initials),
  );
};
