import van, { type State, type ChildDom } from "vanjs-core";

const { div, nav, button, span } = van.tags;

export interface TabItem {
  id: string;
  label: string | State<string>;
  icon?: ChildDom;
  badge?: string | number | State<string | number>;
  disabled?: boolean;
  /**
   * Fábrica del contenido: se ejecuta en CADA activación de la pestaña.
   *
   * Es obligatorio que sea función (no un nodo pre-construido): los paneles
   * inactivos están detached del DOM y van elimina sus bindings — un nodo
   * pre-construido quedaría congelado en el idioma/estado del montaje.
   */
  content: () => ChildDom;
}

export interface TabsProps {
  id?: string;
  items: TabItem[];
  defaultTab?: string;
  activeTab?: State<string>;
  variant?: "underline" | "pills" | "boxed";
  class?: string;
  tabsClass?: string;
  contentClass?: string;
  onChange?: (tabId: string) => void;
}

/**
 * Componente Tabs accesible y reactivo.
 *
 * Soporta navegación por teclado (flechas ←/→, Home, End), roles ARIA
 * (tablist, tab, tabpanel), badges, iconos y variantes visuales (underline, pills, boxed).
 */
export function Tabs(props: TabsProps) {
  const items = props.items;
  const initialTab =
    props.defaultTab ??
    props.activeTab?.val ??
    (items.length > 0 ? items[0].id : "");

  const activeTab = props.activeTab ?? van.state<string>(initialTab);
  const variant = props.variant ?? "underline";

  const handleTabClick = (item: TabItem) => {
    if (item.disabled) return;
    activeTab.val = item.id;
    props.onChange?.(item.id);
  };

  const handleKeyDown = (e: KeyboardEvent, currentIndex: number) => {
    const enabledItems = items.filter((it) => !it.disabled);
    if (enabledItems.length === 0) return;

    let targetItem: TabItem | undefined;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const currentPos = enabledItems.findIndex((it) => it.id === items[currentIndex].id);
      const nextPos = (currentPos + 1) % enabledItems.length;
      targetItem = enabledItems[nextPos];
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const currentPos = enabledItems.findIndex((it) => it.id === items[currentIndex].id);
      const prevPos = (currentPos - 1 + enabledItems.length) % enabledItems.length;
      targetItem = enabledItems[prevPos];
    } else if (e.key === "Home") {
      e.preventDefault();
      targetItem = enabledItems[0];
    } else if (e.key === "End") {
      e.preventDefault();
      targetItem = enabledItems[enabledItems.length - 1];
    }

    if (targetItem) {
      handleTabClick(targetItem);
      const targetBtn = document.getElementById(`tab-btn-${props.id ?? "vui"}-${targetItem.id}`);
      targetBtn?.focus();
    }
  };

  const getTabNavClasses = () => {
    switch (variant) {
      case "pills":
        return "flex flex-wrap items-center gap-1.5 p-1 bg-secondary/15 rounded-xl";
      case "boxed":
        return "flex flex-wrap items-center gap-2 border-b border-border pb-2";
      case "underline":
      default:
        return "flex flex-wrap items-center gap-2 border-b border-border";
    }
  };

  const getTabButtonClasses = (item: TabItem, isActive: boolean) => {
    const base =
      "inline-flex items-center gap-2 font-medium text-sm transition-all outline-none cursor-pointer select-none";

    if (item.disabled) {
      return `${base} opacity-40 cursor-not-allowed text-muted px-3 py-2`;
    }

    if (variant === "pills") {
      return `${base} px-3.5 py-1.5 rounded-lg ${
        isActive
          ? "bg-background text-foreground shadow-sm font-semibold"
          : "text-foreground-soft hover:text-foreground hover:bg-background/50"
      }`;
    }

    if (variant === "boxed") {
      return `${base} px-3.5 py-2 rounded-lg border ${
        isActive
          ? "border-primary bg-primary/10 text-primary font-semibold"
          : "border-border text-foreground-soft hover:text-foreground hover:bg-secondary/10"
      }`;
    }

    // underline variant
    return `${base} px-3.5 py-2.5 -mb-px border-b-2 ${
      isActive
        ? "border-primary text-primary font-semibold"
        : "border-transparent text-foreground-soft hover:text-foreground hover:border-border"
    }`;
  };

  return div(
    {
      ...(props.id ? { id: props.id } : {}),
      class: `w-full flex flex-col ${props.class ?? ""}`,
    },
    // Tablist
    nav(
      {
        role: "tablist",
        class: `${getTabNavClasses()} ${props.tabsClass ?? ""}`,
      },
      items.map((item, index) => {
        const tabId = `tab-btn-${props.id ?? "vui"}-${item.id}`;
        const panelId = `tab-panel-${props.id ?? "vui"}-${item.id}`;

        return button(
          {
            id: tabId,
            role: "tab",
            type: "button",
            "aria-selected": () => (activeTab.val === item.id ? "true" : "false"),
            "aria-controls": panelId,
            ...(item.disabled ? { "aria-disabled": "true" } : {}),
            tabIndex: () => (activeTab.val === item.id ? 0 : -1),
            ...(item.disabled ? { disabled: true } : {}),
            class: () => getTabButtonClasses(item, activeTab.val === item.id),
            onclick: () => handleTabClick(item),
            onkeydown: (e: KeyboardEvent) => handleKeyDown(e, index),
          },
          item.icon ?? null,
          span(item.label),
          item.badge !== undefined
            ? span(
                {
                  class:
                    "text-xs px-1.5 py-0.5 rounded-full font-mono bg-secondary/30 text-foreground-soft",
                },
                item.badge,
              )
            : null,
        );
      }),
    ),
    // Panels
    div(
      {
        class: `pt-4 ${props.contentClass ?? ""}`,
      },
      items.map((item) => {
        const tabId = `tab-btn-${props.id ?? "vui"}-${item.id}`;
        const panelId = `tab-panel-${props.id ?? "vui"}-${item.id}`;

        return () => {
          const isActive = activeTab.val === item.id;
          if (!isActive) return span({ class: "hidden" });

          return div(
            {
              id: panelId,
              role: "tabpanel",
              "aria-labelledby": tabId,
              tabIndex: 0,
              class: "outline-none focus:ring-1 focus:ring-focus rounded-lg",
            },
            item.content(),
          );
        };
      }),
    ),
  );
}
