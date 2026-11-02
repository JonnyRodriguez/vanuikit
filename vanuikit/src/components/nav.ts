import van, { type State, type ChildDom } from "vanjs-core";
import { spaClick } from "../router.js";
import { t } from "../i18n.js";
import { cx, isRouteActive } from "../util.js";
import { VARIANT_CLASSES as BUTTON_VARIANTS, SIZE_CLASSES as BUTTON_SIZES } from "./button.js";

export type LinkVariant = "default" | "muted" | "accent" | "button" | "none";

export interface LinkProps {
  href: string;
  class?: string;
  variant?: LinkVariant;
  /** Navigates with history.replaceState instead of pushState. */
  replace?: boolean;
  /** Treats the link as external even if it points at an internal route. */
  external?: boolean;
  target?: string;
  rel?: string;
  title?: string;
  download?: string;
  onclick?: (e: MouseEvent) => void;
  [key: string]: any;
}

const linkVariantClasses: Record<LinkVariant, string> = {
  default: "text-foreground hover:underline font-medium",
  muted: "text-foreground-soft hover:text-foreground hover:underline",
  accent: "text-accent hover:text-accent-hover hover:underline font-medium cursor-pointer",
  // Same look as Button (primary variant, md size), on an <a>.
  button: cx(
    "inline-flex items-center justify-center rounded-md border border-transparent font-semibold transition duration-200 ease-in-out cursor-pointer",
    BUTTON_VARIANTS.primary,
    BUTTON_SIZES.md,
  ),
  // No base classes: for consumers that bring the full styling
  // (e.g. Nav with its active state) but still want Link's plumbing.
  none: "",
};

/**
 * Link — anchor with embedded SPA navigation: a click runs `navigate(href)`
 * instead of reloading the page. Respects the consumer's decision (a
 * `preventDefault` in `onclick` cancels the navigation) and the user's
 * (modifiers, `target` or external links open natively).
 */
export function Link(props: LinkProps, ...children: ChildDom[]): HTMLAnchorElement {
  const { a } = van.tags;
  const {
    href,
    class: customClass = "",
    variant = "accent",
    replace = false,
    external = false,
    target,
    rel,
    title,
    download,
    onclick,
    ...rest
  } = props;

  return a(
    {
      href,
      class: cx(linkVariantClasses[variant], customClass),
      // Keys present only when valued: van would write "undefined" attrs.
      ...(target ? { target } : {}),
      // Links opening a new tab do not hand over window.opener.
      ...(target === "_blank" && !rel ? { rel: "noopener noreferrer" } : rel ? { rel } : {}),
      ...(title ? { title } : {}),
      ...(download ? { download } : {}),
      onclick: (e: MouseEvent) => {
        if (onclick) onclick(e);
        spaClick(e, href, { replace, external, target });
      },
      ...rest,
    },
    ...children,
  );
}

export type NavLink = {
  href: string;
  label: string | State<string> | (() => string | Node);
};

type NavProps = {
  /** Route of the current link (string or reactive State); gets the active class and aria-current. */
  current: string | State<string>;
  /** Accessible name of the menu; by default resolved with i18n ("Main navigation"). */
  ariaLabel?: string | State<string>;
  class?: string;
};

/**
 * Nav — horizontal menu of links, the row counterpart of the Sidebar.
 *
 * Items are defined by the consumer; `current` marks the active one (exact
 * match or by subroute) with a highlighted class and `aria-current="page"`.
 * Clicks navigate embedded through vanuikit's router, without reloading the
 * page. It only styles the component: the page layout (centering, margins)
 * is provided by the consumer via `class`.
 */
export const Nav = (links: NavLink[], props: NavProps) => {
  const { nav } = van.tags;
  const { current, ariaLabel, class: extra } = props;

  // Resolved once: t() creates a new derive per call, and this
  // binding reacts to the language without registering derivations on each re-render.
  const resolvedLabel = ariaLabel ?? t("nav.ariaLabel", "Main navigation");

  const getCurrent = () =>
    typeof current === "object" && current !== null && "val" in current
      ? (current as State<string>).val
      : (current as string);

  return nav(
    {
      class: cx("flex flex-wrap items-center gap-x-4 gap-y-1", extra),
      "aria-label": () =>
        typeof resolvedLabel === "object" && "val" in resolvedLabel ? resolvedLabel.val : resolvedLabel,
    },
    links.map((link) =>
      // Re-render per link (same language approach as SidebarItem): active class and
      // aria-current are written atomically, with no derivations that
      // outlive the tree unmount. Anchors are Link (variant
      // "none" + own styling): the same navigation plumbing for all.
      () => {
        const isActive = isRouteActive(getCurrent(), link.href);
        return Link(
          {
            href: link.href,
            variant: "none",
            class: cx(
              "text-accent no-underline text-[0.9rem] hover:underline transition-colors cursor-pointer",
              isActive && "font-bold",
            ),
            ...(isActive ? { "aria-current": "page" } : {}),
          },
          link.label,
        );
      },
    ),
  );
};
