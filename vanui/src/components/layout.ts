import van, { type State } from "vanjs-core";
import { cx } from "../util.js";
import { Badge } from "./badge.js";

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
      return cur === props.href || cur.startsWith(props.href + "/");
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

  const renderBadge = () => {
    if (props.badge === undefined || props.badge === null) return null;
    if (typeof props.badge === "string" || typeof props.badge === "number") {
      return Badge({ text: props.badge, variant: (props.badgeVariant as any) ?? "primary", size: "sm" });
    }
    if (typeof props.badge === "object" && "val" in props.badge) {
      return () => Badge({ text: (props.badge as any)?.val, variant: (props.badgeVariant as any) ?? "primary", size: "sm" });
    }
    return props.badge as Node;
  };

  return () => {
    const isActive = isCurrentActive();
    return tag(
      {
        href: props.href,
        type: props.href ? undefined : "button",
        class: cx(
          "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all no-underline cursor-pointer select-none text-left border border-transparent",
          isActive
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
          props.class,
        ),
        "aria-current": isActive ? "page" : undefined,
        onclick: (e: MouseEvent) => {
          if (props.onclick) props.onclick(e);
        },
      },
      div(
        { class: "flex items-center gap-3 min-w-0" },
        renderIcon(),
        span({ class: "truncate" }, props.label),
      ),
      renderBadge(),
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
            class: "px-3.5 pb-1 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider select-none",
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
  class?: string;
};

export function Sidebar(props: SidebarProps) {
  const { aside, div, button } = van.tags;

  return aside(
    {
      class: cx(
        "flex flex-col justify-between h-full bg-card border-r border-border w-64 p-4 text-foreground select-none transition-colors",
        props.class,
      ),
      "aria-label": "Sidebar",
    },
    // Top section: header + navigation
    div(
      { class: "flex flex-col gap-4 overflow-y-auto flex-1 pr-1" },
      props.header
        ? div(
            { class: "flex items-center justify-between gap-2 pb-3 border-b border-border/60" },
            props.header,
            props.onClose
              ? button(
                  {
                    type: "button",
                    class:
                      "lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary text-base cursor-pointer",
                    "aria-label": "Cerrar menú",
                    onclick: props.onClose,
                  },
                  "✕",
                )
              : null,
          )
        : null,
      div(
        { class: "flex flex-col gap-1" },
        props.content,
      ),
    ),
    // Bottom section: footer / user profile
    props.footer
      ? div(
          { class: "pt-4 border-t border-border/60 mt-auto" },
          props.footer,
        )
      : null,
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

  return div(
    {
      class: cx(
        "min-h-screen flex bg-background text-foreground transition-colors overflow-x-hidden relative",
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

    // Sidebar Container (Smooth slide-in drawer on mobile, static aside on desktop lg:)
    div(
      {
        class: van.derive(() =>
          cx(
            "app-shell-sidebar fixed inset-y-0 left-0 z-50 transform lg:static lg:transform-none transition-transform duration-200 ease-in-out",
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
