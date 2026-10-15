import van, { type State } from "vanjs-core";
import { t, raw } from "../i18n.js";
import { spaClick } from "../router.js";
import { cx, isRouteActive } from "../util.js";
import { Badge } from "./badge.js";

/** Contrato de llaves de i18n del componente */
export const TEXTS = {
  collapse: { key: "sidebar.collapse", default: "Colapsar barra lateral" },
  expand: { key: "sidebar.expand", default: "Expandir barra lateral" },
  close: { key: "sidebar.close", default: "Cerrar menú" },
  title: { key: "sidebar.title", default: "Sidebar" },
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

  const renderBadge = () => {
    if (props.badge === undefined || props.badge === null) return null;
    const badgeNode =
      typeof props.badge === "string" || typeof props.badge === "number"
        ? Badge({ text: props.badge, variant: (props.badgeVariant as any) ?? "primary", size: "sm" })
        : typeof props.badge === "object" && "val" in props.badge
          ? () => Badge({ text: (props.badge as any)?.val, variant: (props.badgeVariant as any) ?? "primary", size: "sm" })
          : props.badge;
    // Wrapper con ganancia semántica: el modo rail de Sidebar la oculta.
    return van.tags.span({ class: "vui-sb-badge shrink-0" }, badgeNode as Node);
  };

  const labelText = typeof props.label === "string" ? props.label : null;

  return () => {
    const isActive = isCurrentActive();
    return tag(
      {
        // Van no acepta `undefined` como valor de prop: con el setter del DOM
        // terminaría como attr `href="undefined"`. Omitir la clave por rama.
        ...(props.href ? { href: props.href } : { type: "button" }),
        // Nombre accesible estable aunque el modo rail oculte el texto visible.
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
          // Navegación SPA embebida: el consumidor solo necesita su propio
          // estado (p. ej. cerrar el drawer); el router lo maneja vanui.
          if (props.href) spaClick(e, props.href);
        },
      },
      div(
        { class: "flex items-center gap-3 min-w-0" },
        renderIcon(),
        span({ class: "vui-sb-label truncate" }, props.label),
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
            class: "vui-sb-group-title px-3.5 pb-1 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider select-none",
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
  /** Muestra el botón de colapso en desktop (ancho completo ↔ rail de iconos). */
  collapsible?: boolean;
  /** Estado controlado del colapso. Si se omite y `collapsible`, se gestiona internamente. */
  collapsed?: State<boolean>;
  /** Clave de localStorage para persistir el colapso no controlado (por defecto "vanui-sidebar-collapsed"). */
  storageKey?: string;
  class?: string;
};

export function Sidebar(props: SidebarProps) {
  const { aside, div, button, span } = van.tags;

  let collapsed: State<boolean>;
  if (props.collapsed) {
    collapsed = props.collapsed;
    // Controlado con storageKey: el storage inicializa al montar y refleja
    // cada cambio (el consumidor sigue siendo dueño del estado).
    if (props.storageKey && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(props.storageKey);
      if (saved != null) collapsed.val = saved === "1";
      van.derive(() => {
        localStorage.setItem(props.storageKey!, collapsed.val ? "1" : "0");
      });
    }
  } else {
    const storageKey = props.storageKey ?? "vanui-sidebar-collapsed";
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(storageKey) : null;
    collapsed = van.state(saved === "1");
    van.derive(() => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, collapsed.val ? "1" : "0");
      }
    });
  }

  const railClass = () =>
    collapsed.val
      ? // Modo rail SOLO desktop (lg:): en mobile el drawer siempre se abre
        // expandido, sin importar el estado de colapso de desktop.
        "lg:[&_.vui-sb-header]:hidden lg:[&_.vui-sb-group-title]:hidden lg:[&_.vui-sb-label]:hidden lg:[&_.vui-sb-badge]:hidden lg:[&_.vui-sb-item]:justify-center lg:[&_.vui-sb-item]:px-2"
      : "";

  // Botón de colapso (solo desktop: en mobile manda el drawer con backdrop).
  const collapseToggle = props.collapsible
    ? button(
        {
          type: "button",
          class:
            "hidden lg:inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors shrink-0",
          "aria-label": () => {
            // Leer collapsed.val aquí dentro: si la clave se elige fuera, el
            // derive de t() no depende del estado y el label no se actualiza.
            const label = collapsed.val ? TEXTS.expand : TEXTS.collapse;
            return raw(label.key, label.default);
          },
          "aria-expanded": () => (collapsed.val ? "false" : "true"),
          onclick: () => {
            collapsed.val = !collapsed.val;
          },
        },
        () => span({ class: "text-sm leading-none select-none", "aria-hidden": "true" }, collapsed.val ? "»" : "«"),
      )
    : null;

  return aside(
    {
      class: van.derive(() =>
        cx(
          "h-full flex flex-col justify-between bg-card border-r border-border text-foreground select-none w-64 p-4 transition-[width] duration-200",
          collapsed.val && "lg:w-20 lg:px-3",
          railClass(),
          props.class,
        ),
      ),
      "aria-label": t("sidebar.title", "Sidebar"),
    },
    // Sección superior: header + navegación (scroll interno, el footer queda fijo).
    div(
      { class: "flex flex-col gap-4 overflow-y-auto flex-1 pr-1" },
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
                      "lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary text-base cursor-pointer",
                    "aria-label": t("sidebar.close", "Cerrar menú"),
                    onclick: props.onClose,
                  },
                  "✕",
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
    // Sección inferior: footer / perfil de usuario (siempre visible: el nav
    // scrollea internamente, la barra completa queda anclada al viewport).
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

  // Al cruzar a desktop el drawer pierde sentido (la barra queda fija):
  // cerrarlo, para no arrastrar un estado abierto que no se ve pero sí
  // afecta a consumidores que derivan del isOpen (p. ej. footers compactos).
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
        // Sin overflow-x-hidden en la raíz: un ancestro con overflow != visible
        // rompe el position:sticky del sidebar en desktop (el drawer mobile es
        // fixed, no genera overflow del documento, no hace falta).
        "min-h-screen flex bg-background text-foreground transition-colors relative",
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
    // sticky aside on desktop lg: — h-dvh para que header/contenido/footer
    // vivan en la altura de la ventana y el footer (logout) nunca se vaya
    // al fondo del documento en páginas largas).
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
