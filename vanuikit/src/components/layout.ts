import van, { type State } from "vanjs-core";
import { t, raw } from "../i18n.js";
import { spaClick } from "../router.js";
import { cx, isRouteActive } from "../util.js";
import { Badge } from "./badge.js";
import { Icon } from "./icon.js";

/** Component i18n key contract */
export const TEXTS = {
  collapse: { key: "sidebar.collapse", default: "Collapse sidebar" },
  expand: { key: "sidebar.expand", default: "Expand sidebar" },
  close: { key: "sidebar.close", default: "Close menu" },
  title: { key: "sidebar.title", default: "Sidebar" },
  resize: { key: "sidebar.resize", default: "Resize sidebar" },
} as const;

export type SidebarItemProps = {
  href?: string;
  label: string | State<string> | (() => string | Node);
  icon?: string | Node | (() => Node);
  badge?: string | number | State<string | number> | Node;
  badgeVariant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
  active?: boolean | State<boolean> | (() => boolean);
  current?: string | State<string>;
  onclick?: (e: MouseEvent) => void;
  class?: string;
};

export function SidebarItem(props: SidebarItemProps) {
  const { a, button, span, div } = van.tags;
  const tag = props.href ? a : button;

  const isCurrentActive = () => {
    if (typeof props.active === "boolean") return props.active;
    if (typeof props.active === "function") return props.active();
    if (props.active && "val" in props.active) return props.active.val;
    if (props.href && props.current) {
      const cur = typeof props.current === "string" ? props.current : props.current.val;
      return isRouteActive(cur, props.href);
    }
    return false;
  };

  const renderIcon = () => {
    if (!props.icon) return null;
    if (typeof props.icon === "string") {
      return span({ class: "text-lg shrink-0 flex items-center justify-center w-6 h-6 select-none" }, props.icon);
    }
    if (typeof props.icon === "function") {
      return span({ class: "shrink-0 flex items-center justify-center w-6 h-6" }, props.icon());
    }
    return span({ class: "shrink-0 flex items-center justify-center w-6 h-6" }, props.icon);
  };

  // On the active item (solid `bg-primary` background), the badge needs
  // light text to keep contrast (≥ 4.5:1); the kit's shadow variants are
  // designed for light backgrounds.
  const renderBadge = (isActive: boolean) => {
    if (props.badge === undefined || props.badge === null) return null;
    const activeOverrides = isActive ? "!bg-white !text-primary !border-transparent" : "";
    const badgeNode =
      typeof props.badge === "string" || typeof props.badge === "number"
        ? Badge({ text: props.badge, variant: (props.badgeVariant as any) ?? "primary", size: "sm", class: activeOverrides })
        : typeof props.badge === "object" && "val" in props.badge
          ? () => Badge({ text: (props.badge as any)?.val, variant: (props.badgeVariant as any) ?? "primary", size: "sm", class: activeOverrides })
          : props.badge;
    // Wrapper with semantic gain: the Sidebar rail mode hides it.
    return van.tags.span({ class: "vui-sb-badge shrink-0" }, badgeNode as Node);
  };

  const labelText = typeof props.label === "string" ? props.label : null;

  return () => {
    const isActive = isCurrentActive();
    return tag(
      {
        // Van does not accept `undefined` as a prop value: with the DOM setter
        // it would end up as attr `href="undefined"`. Omit the key per branch.
        ...(props.href ? { href: props.href } : { type: "button" }),
        // Stable accessible name even if rail mode hides the visible text.
        ...(labelText ? { "aria-label": labelText } : {}),
        class: cx(
          "vui-sb-item w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all no-underline cursor-pointer select-none text-left border border-transparent",
          isActive
            ? "bg-primary text-primary-fg font-semibold shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
          props.class,
        ),
        ...(isActive ? { "aria-current": "page" } : {}),
        onclick: (e: MouseEvent) => {
          if (props.onclick) props.onclick(e);
          // Embedded SPA navigation: the consumer only needs its own
          // state (e.g. closing the drawer); vanuikit handles the routing.
          if (props.href) spaClick(e, props.href);
        },
      },
      div(
        { class: "flex items-center gap-3 min-w-0" },
        renderIcon(),
        span({ class: "vui-sb-label truncate" }, props.label),
      ),
      renderBadge(isActive),
    );
  };
}

export type SidebarGroupProps = {
  title?: string | State<string> | (() => string);
  class?: string;
};

export function SidebarGroup(props: SidebarGroupProps, ...children: (Node | (() => Node | null | undefined) | null | undefined)[]) {
  const { div, h3 } = van.tags;
  return div(
    { class: cx("flex flex-col gap-1 py-2", props.class) },
    props.title
      ? h3(
          {
            class: "vui-sb-group-title px-3.5 pb-1 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none",
          },
          props.title,
        )
      : null,
    children,
  );
}

export type SidebarProps = {
  header?: Node | string | (() => Node);
  content?: Node | (Node | HTMLElement | (() => Node | null | undefined) | null | undefined)[] | (() => Node);
  footer?: Node | string | (() => Node);
  isOpen?: State<boolean>;
  onClose?: () => void;
  /** Shows the collapse button on desktop (full width ↔ icon rail). */
  collapsible?: boolean;
  /** Controlled collapse state. If omitted with `collapsible`, managed internally. */
  collapsed?: State<boolean>;
  /** localStorage key to persist uncontrolled collapse (default "vanuikit-sidebar-collapsed"). */
  storageKey?: string;
  /** Allows resizing the width by dragging the right edge (desktop only). */
  resizable?: boolean;
  /** Initial width in px when resizable (default 256). */
  defaultWidth?: number;
  /** Minimum width in px (default 224). */
  minWidth?: number;
  /** Maximum width in px (default 384). */
  maxWidth?: number;
  /** localStorage key to persist the width (default "vanuikit-sidebar-width"). */
  widthStorageKey?: string;
  class?: string;
};

export function Sidebar(props: SidebarProps) {
  const { aside, div, button, span } = van.tags;

  let collapsed: State<boolean>;
  if (props.collapsed) {
    collapsed = props.collapsed;
    // Controlled with storageKey: storage initializes on mount and mirrors
    // every change (the consumer still owns the state).
    if (props.storageKey && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(props.storageKey);
      if (saved != null) collapsed.val = saved === "1";
      van.derive(() => {
        localStorage.setItem(props.storageKey!, collapsed.val ? "1" : "0");
      });
    }
  } else {
    const storageKey = props.storageKey ?? "vanuikit-sidebar-collapsed";
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(storageKey) : null;
    collapsed = van.state(saved === "1");
    van.derive(() => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, collapsed.val ? "1" : "0");
      }
    });
  }

  // Horizontal resize (desktop only): width with persistence, drag handle
  // and keyboard support (Separator with ArrowLeft/ArrowRight).
  const minW = props.minWidth ?? 224;
  const maxW = props.maxWidth ?? 384;
  const widthStorageKey = props.widthStorageKey ?? "vanuikit-sidebar-width";

  const initialWidth = props.resizable
    ? (() => {
        const savedRaw =
          typeof localStorage !== "undefined" ? localStorage.getItem(widthStorageKey) : null;
        const saved = savedRaw != null ? Number(savedRaw) : NaN;
        return Number.isFinite(saved)
          ? Math.min(maxW, Math.max(minW, saved))
          : (props.defaultWidth ?? 256);
      })()
    : 256;

  const width = van.state(initialWidth);
  if (props.resizable) {
    van.derive(() => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(widthStorageKey, String(Math.round(width.val)));
      }
    });
  }

  const dragging = van.state(false);

  const startResize = (e: PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width.val;
    dragging.val = true;
    const onMove = (ev: PointerEvent) => {
      width.val = Math.min(maxW, Math.max(minW, startW + ev.clientX - startX));
    };
    const onUp = () => {
      dragging.val = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const resizer = props.resizable
    ? div({
        class: van.derive(() =>
          cx(
            "vui-sb-resizer absolute top-0 bottom-0 right-0 w-1.5 cursor-col-resize touch-none select-none",
            collapsed.val && "vui-sb-collapsed",
            dragging.val && "is-dragging",
          ),
        ),
        role: "separator",
        "aria-orientation": "vertical",
        "aria-label": () => raw(TEXTS.resize.key, TEXTS.resize.default),
        "aria-valuenow": () => Math.round(width.val),
        "aria-valuemin": minW,
        "aria-valuemax": maxW,
        tabindex: 0,
        onpointerdown: startResize,
        onkeydown: (e: KeyboardEvent) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            width.val = Math.min(maxW, Math.max(minW, width.val + (e.key === "ArrowRight" ? 16 : -16)));
          }
        },
      })
    : null;

  const railClass = () =>
    collapsed.val
      ? // Rail mode DESKTOP only (lg:): on mobile the drawer always opens
        // expanded, regardless of the desktop collapse state.
        "lg:[&_.vui-sb-header]:hidden lg:[&_.vui-sb-group-title]:hidden lg:[&_.vui-sb-label]:hidden lg:[&_.vui-sb-badge]:hidden lg:[&_.vui-sb-item]:justify-center lg:[&_.vui-sb-item]:px-2"
      : "";

  // Collapse button (desktop only: on mobile the drawer with backdrop rules).
  // SVG chevron that rotates 180° with the state: points toward the action
  // performed when pressed (collapse → left; expand → right).
  const collapseToggle = props.collapsible
    ? button(
        {
          type: "button",
          class:
            "hidden lg:inline-flex items-center justify-center size-7 rounded-lg border border-border/60 bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary-hover hover:border-border shadow-sm cursor-pointer transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          "aria-label": () => {
            // Read collapsed.val in here: if the key were chosen outside, the
            // derive would not depend on the state and the label would not update.
            const label = collapsed.val ? TEXTS.expand : TEXTS.collapse;
            return raw(label.key, label.default);
          },
          "aria-expanded": () => (collapsed.val ? "false" : "true"),
          onclick: () => {
            collapsed.val = !collapsed.val;
          },
        },
        () =>
          Icon({
            name: "chevron-left",
            class: () =>
              cx("transition-transform duration-200 ease-in-out", collapsed.val && "rotate-180"),
          }),
      )
    : null;

  return aside(
    {
      class: van.derive(() =>
        cx(
          "relative h-full flex flex-col justify-between bg-card border-r border-border text-foreground select-none w-64 p-4 transition-[width] duration-200",
          collapsed.val && "lg:w-20 lg:px-3",
          railClass(),
          props.class,
        ),
      ),
      // Width controlled by resize (inline beats w-64; in collapsed rail it is
      // omitted so lg:w-20 rules). Transition disabled during drag.
      style: () =>
        props.resizable && !collapsed.val
          ? `width:${width.val}px${dragging.val ? ";transition:none" : ""}`
          : "",
      "aria-label": t("sidebar.title", "Sidebar"),
    },
    // Top section: header + navigation (internal scroll, the footer stays fixed).
    div(
      { class: "vui-sb-nav flex flex-col gap-4 overflow-y-auto flex-1 pr-1" },
      props.header || props.onClose || collapseToggle
        ? div(
            {
              class: () =>
                cx(
                  "flex items-center gap-2 pb-3 border-b border-border/60",
                  props.header ? "justify-between" : "justify-center",
                ),
            },
            props.header
              ? div({ class: () => cx("vui-sb-header min-w-0 flex-1", collapsed.val && "hidden") }, props.header)
              : null,
            props.onClose
              ? button(
                  {
                    type: "button",
                    class:
                      "lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer",
                    "aria-label": t("sidebar.close", "Close menu"),
                    onclick: props.onClose,
                  },
                  Icon({ name: "x" }),
                )
              : null,
            collapseToggle,
          )
        : null,
      div(
        { class: "flex flex-col gap-1" },
        props.content,
      ),
    ),
    // Bottom section: footer / user profile (always visible: the nav
    // scrolls internally, the whole bar stays anchored to the viewport).
    props.footer
      ? div(
          {
            class: () =>
              cx(
                "pt-4 border-t border-border/60 mt-auto",
                collapsed.val && "lg:flex lg:justify-center lg:overflow-hidden",
              ),
          },
          props.footer,
        )
      : null,
    resizer,
  );
}

export type HeaderBarProps = {
  leading?: Node | (() => Node | null | undefined);
  title?: string | State<string> | Node | (() => Node | string);
  actions?: any;
  class?: string;
};

export function HeaderBar(props: HeaderBarProps) {
  const { header, div, h1 } = van.tags;

  const renderTitle = () => {
    if (!props.title) return null;
    if (typeof props.title === "string") {
      return h1({ class: "text-base sm:text-lg font-bold text-foreground tracking-tight truncate" }, props.title);
    }
    if (typeof props.title === "function") {
      return () => {
        const val = (props.title as Function)();
        if (typeof val === "string") {
          return h1({ class: "text-base sm:text-lg font-bold text-foreground tracking-tight truncate" }, val);
        }
        return val;
      };
    }
    if (typeof props.title === "object" && "val" in props.title) {
      return () => h1({ class: "text-base sm:text-lg font-bold text-foreground tracking-tight truncate" }, (props.title as any).val);
    }
    return props.title;
  };

  return header(
    {
      class: cx(
        "sticky top-0 z-30 flex items-center justify-between gap-3 h-16 px-4 sm:px-6 bg-card/80 backdrop-blur-md border-b border-border transition-colors",
        props.class,
      ),
    },
    div(
      { class: "flex items-center gap-3 min-w-0" },
      props.leading,
      renderTitle(),
    ),
    div({ class: "flex items-center gap-2 sm:gap-3" }, props.actions),
  );
}

export type AppShellProps = {
  sidebar: Node | (() => Node);
  header?: Node | (() => Node | null | undefined);
  content: Node | (() => Node | null | undefined);
  footer?: Node | (() => Node | null | undefined);
  sidebarOpen?: State<boolean>;
  class?: string;
};

export function AppShell(props: AppShellProps) {
  const { div } = van.tags;
  const isOpen = props.sidebarOpen ?? van.state(false);

  const closeSidebar = () => {
    isOpen.val = false;
  };

  // Once on desktop the drawer stops making sense (the bar becomes fixed):
  // close it, so an open state that is not visible does not linger but still
  // affects consumers deriving from isOpen (e.g. compact footers).
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onDesktop = (e: MediaQueryListEvent) => {
      if (e.matches) isOpen.val = false;
    };
    mq.addEventListener("change", onDesktop);
  }

  return div(
    {
      class: cx(
        // No overflow-x-hidden at the root: an ancestor with overflow != visible
        // breaks the sidebar's position:sticky on desktop (the mobile drawer is
        // fixed, it does not overflow the document, not needed).
        // vui-app-shell: stability hook. The library pins the sidebar
        // positioning under this hook with its own specificity, so that a
        // consumer regenerating utilities (e.g. the .fixed of their own
        // UnoCSS sheet) cannot break the shell layout.
        "vui-app-shell min-h-screen flex bg-background text-foreground transition-colors relative",
        props.class,
      ),
    },
    // Mobile Backdrop Drawer Overlay with smooth CSS fade transition
    div({
      class: van.derive(() =>
        cx(
          "app-shell-backdrop fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-200",
          isOpen.val ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ),
      ),
      onclick: closeSidebar,
      "aria-hidden": van.derive(() => (isOpen.val ? "false" : "true")),
    }),

    // Sidebar Container (Smooth slide-in drawer on mobile, viewport-anchored
    // sticky aside on desktop lg: — h-dvh so header/content/footer
    // live within the window height and the footer (logout) never ends up
    // at the bottom of the document on long pages).
    div(
      {
        class: van.derive(() =>
          cx(
            "app-shell-sidebar fixed inset-y-0 left-0 z-50 transform lg:sticky lg:top-0 lg:h-dvh lg:transform-none transition-transform duration-200 ease-in-out",
            isOpen.val ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          ),
        ),
      },
      props.sidebar,
    ),

    // Main App Area (Header + Scrollable Content + Footer)
    div(
      { class: "flex-1 flex flex-col min-w-0 min-h-screen" },
      props.header,
      div(
        { class: "flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" },
        props.content,
      ),
      props.footer,
    ),
  );
}
