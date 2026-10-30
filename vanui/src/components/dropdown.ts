import van, { type State, type ChildDom } from "vanjs-core";
import { t } from "../i18n.js";
import { Icon } from "./icon.js";

const { div, button, span, input, ul, li, hr } = van.tags;

// ---------------------------------------------------------------------
// 1. SelectDropdown (Selector personalizado y accesible)
// ---------------------------------------------------------------------

export interface SelectOption<T = string | number> {
  value: T;
  label: string | State<string>;
  description?: string | State<string>;
  icon?: ChildDom;
  disabled?: boolean;
}

export interface SelectDropdownProps<T = string | number> {
  id?: string;
  name?: string;
  options: SelectOption<T>[] | State<SelectOption<T>[]>;
  value?: State<T> | T;
  defaultValue?: T;
  placeholder?: string | State<string>;
  searchable?: boolean;
  searchPlaceholder?: string | State<string>;
  disabled?: boolean | State<boolean>;
  class?: string;
  onChange?: (value: T, option: SelectOption<T>) => void;
}

export function SelectDropdown<T = string | number>(props: SelectDropdownProps<T>) {
  const getOptions = (): SelectOption<T>[] => {
    return Array.isArray(props.options) ? props.options : props.options.val;
  };

  const initialVal =
    (props.value && typeof props.value === "object" && "val" in props.value
      ? props.value.val
      : props.value) ??
    props.defaultValue ??
    (getOptions().length > 0 ? getOptions()[0].value : undefined);

  const selectedValue =
    props.value && typeof props.value === "object" && "val" in props.value
      ? (props.value as State<T>)
      : van.state<T>(initialVal as T);

  const isOpen = van.state(false);
  const searchQuery = van.state("");
  const focusedIndex = van.state(-1);

  const containerId = props.id ?? `vui-select-${Math.random().toString(36).slice(2, 8)}`;
  const listboxId = `${containerId}-listbox`;

  const closeMenu = () => {
    isOpen.val = false;
    searchQuery.val = "";
    focusedIndex.val = -1;
  };

  const toggleMenu = () => {
    const isDisabled =
      props.disabled && typeof props.disabled === "object" && "val" in props.disabled
        ? props.disabled.val
        : Boolean(props.disabled);

    if (isDisabled) return;

    isOpen.val = !isOpen.val;
    if (isOpen.val) {
      const opts = getOptions();
      const currentIdx = opts.findIndex((o) => o.value === selectedValue.val);
      focusedIndex.val = currentIdx >= 0 ? currentIdx : 0;
    } else {
      searchQuery.val = "";
      focusedIndex.val = -1;
    }
  };

  const selectOption = (opt: SelectOption<T>) => {
    if (opt.disabled) return;
    selectedValue.val = opt.value;
    props.onChange?.(opt.value, opt);
    closeMenu();
    const triggerBtn = document.getElementById(`${containerId}-btn`);
    triggerBtn?.focus();
  };

  if (typeof window !== "undefined") {
    const handleDocumentClick = (e: MouseEvent) => {
      const el = document.getElementById(containerId);
      if (el && !el.contains(e.target as Node) && isOpen.val) {
        closeMenu();
      }
    };
    document.addEventListener("click", handleDocumentClick);
  }

  const handleKeyDown = (e: KeyboardEvent, filteredOpts: SelectOption<T>[]) => {
    if (!isOpen.val) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        isOpen.val = true;
        const currentIdx = filteredOpts.findIndex((o) => o.value === selectedValue.val);
        focusedIndex.val = currentIdx >= 0 ? currentIdx : 0;
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      const triggerBtn = document.getElementById(`${containerId}-btn`);
      triggerBtn?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusedIndex.val = (focusedIndex.val + 1) % filteredOpts.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusedIndex.val = (focusedIndex.val - 1 + filteredOpts.length) % filteredOpts.length;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focusedIndex.val >= 0 && focusedIndex.val < filteredOpts.length) {
        selectOption(filteredOpts[focusedIndex.val]);
      }
    } else if (e.key === "Tab") {
      closeMenu();
    }
  };

  const isDisabledGetter = () =>
    props.disabled && typeof props.disabled === "object" && "val" in props.disabled
      ? props.disabled.val
      : Boolean(props.disabled);

  return div(
    {
      id: containerId,
      class: `relative inline-block w-full text-left ${props.class ?? ""}`,
      onkeydown: (e: KeyboardEvent) => {
        const opts = getOptions().filter((opt) =>
          props.searchable && searchQuery.val
            ? String(typeof opt.label === "object" && "val" in opt.label ? opt.label.val : opt.label)
                .toLowerCase()
                .includes(searchQuery.val.toLowerCase())
            : true,
        );
        handleKeyDown(e, opts);
      },
    },
    // Botón / Trigger
    button(
      {
        id: `${containerId}-btn`,
        type: "button",
        role: "combobox",
        "aria-haspopup": "listbox",
        "aria-expanded": () => (isOpen.val ? "true" : "false"),
        "aria-controls": listboxId,
        disabled: isDisabledGetter,
        class: () =>
          `w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium transition-all shadow-sm outline-none ${
            isDisabledGetter()
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-focus focus:ring-2 focus:ring-focus cursor-pointer"
          }`,
        onclick: toggleMenu,
      },
      () => {
        const allOpts = getOptions();
        const currentOpt = allOpts.find((o) => o.value === selectedValue.val);
        return div(
          { class: "flex items-center gap-2 truncate" },
          currentOpt?.icon ?? null,
          span(
            { class: currentOpt ? "text-foreground" : "text-muted" },
            currentOpt
              ? currentOpt.label
              : props.placeholder ?? "Seleccionar opción...",
          ),
        );
      },
      () =>
        span(
          {
            class: `text-xs text-muted transition-transform duration-200 ${
              isOpen.val ? "rotate-180" : ""
            }`,
          },
          "▼",
        ),
    ),
    // Menú desplegable
    () => {
      if (!isOpen.val) return span({ class: "hidden" });

      const allOpts = getOptions();
      const filtered = allOpts.filter((opt) => {
        if (!props.searchable || !searchQuery.val) return true;
        const text = String(
          typeof opt.label === "object" && "val" in opt.label ? opt.label.val : opt.label,
        ).toLowerCase();
        return text.includes(searchQuery.val.toLowerCase());
      });

      return div(
        {
          class:
            "absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-background shadow-xl overflow-hidden",
        },
        props.searchable
          ? div(
              { class: "p-2 border-b border-border bg-secondary/10" },
              input({
                type: "text",
                placeholder: props.searchPlaceholder ?? t("dropdown.searchPlaceholder", "Buscar..."),
                value: searchQuery.val,
                class:
                  "w-full px-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-focus",
                oninput: (e: Event) =>
                  (searchQuery.val = (e.target as HTMLInputElement).value),
                onkeydown: (e: KeyboardEvent) => e.stopPropagation(),
              }),
            )
          : null,
        ul(
          {
            id: listboxId,
            role: "listbox",
            class: "max-h-60 overflow-y-auto py-1 list-none m-0 p-0",
          },
          filtered.length === 0
            ? li(
                { class: "px-3 py-4 text-xs text-center text-muted italic" },
                t("dropdown.empty", "No se encontraron resultados"),
              )
            : filtered.map((opt, idx) => {
                const isSelected = selectedValue.val === opt.value;
                const isFocused = focusedIndex.val === idx;

                return li(
                  {
                    role: "option",
                    "aria-selected": isSelected ? "true" : "false",
                    ...(opt.disabled ? { "aria-disabled": "true" } : {}),
                    class: `flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : isFocused
                        ? "bg-secondary/20 text-foreground"
                        : "text-foreground hover:bg-secondary/15"
                    }`,
                    onclick: (e: MouseEvent) => {
                      e.stopPropagation();
                      selectOption(opt);
                    },
                  },
                  div(
                    { class: "flex items-center gap-2 truncate" },
                    opt.icon ?? null,
                    div(
                      { class: "flex flex-col truncate" },
                      span({ class: "truncate" }, opt.label),
                      opt.description
                        ? span(
                            { class: "text-xs text-muted font-normal truncate" },
                            opt.description,
                          )
                        : null,
                    ),
                  ),
                  isSelected
                    ? Icon({ name: "check", class: "size-3.5 text-primary" })
                    : null,
                );
              }),
        ),
      );
    },
  );
}

// ---------------------------------------------------------------------
// 2. DropdownMenu (Menú de acciones contextual)
// ---------------------------------------------------------------------

export type DropdownMenuItem =
  | {
      type?: "item";
      label: string | State<string>;
      icon?: ChildDom;
      badge?: string | number;
      disabled?: boolean;
      destructive?: boolean;
      onClick?: (e: MouseEvent) => void;
    }
  | {
      type: "header";
      label: string | State<string>;
    }
  | {
      type: "divider";
    };

export interface DropdownMenuProps {
  id?: string;
  trigger: (isOpen: State<boolean>) => ChildDom;
  items: DropdownMenuItem[];
  align?: "left" | "right";
  class?: string;
}

export function DropdownMenu(props: DropdownMenuProps) {
  const isOpen = van.state(false);
  const containerId = props.id ?? `vui-dropdown-${Math.random().toString(36).slice(2, 8)}`;
  const align = props.align ?? "left";

  const close = () => (isOpen.val = false);
  const toggle = () => (isOpen.val = !isOpen.val);

  if (typeof window !== "undefined") {
    const handleDocumentClick = (e: MouseEvent) => {
      const el = document.getElementById(containerId);
      if (el && !el.contains(e.target as Node) && isOpen.val) {
        close();
      }
    };
    document.addEventListener("click", handleDocumentClick);
  }

  return div(
    {
      id: containerId,
      class: `relative inline-block text-left ${props.class ?? ""}`,
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen.val) {
          e.preventDefault();
          close();
        }
      },
    },
    div(
      {
        class: "cursor-pointer inline-flex",
        onclick: (e: MouseEvent) => {
          e.stopPropagation();
          toggle();
        },
      },
      props.trigger(isOpen),
    ),
    () => {
      if (!isOpen.val) return span({ class: "hidden" });

      return div(
        {
          class: `absolute top-full mt-1 z-50 min-w-[12rem] rounded-xl border border-border bg-background shadow-xl py-1 ${
            align === "right" ? "right-0" : "left-0"
          }`,
          role: "menu",
          "aria-orientation": "vertical",
        },
        props.items.map((item) => {
          if (item.type === "divider") {
            return hr({ class: "border-border my-1" });
          }

          if (item.type === "header") {
            return div(
              {
                class:
                  "px-3 py-1.5 text-xs font-bold text-muted uppercase tracking-wider",
              },
              item.label,
            );
          }

          return button(
            {
              type: "button",
              role: "menuitem",
              ...(item.disabled ? { disabled: true } : {}),
              class: `w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors border-none bg-transparent ${
                item.disabled
                  ? "opacity-40 cursor-not-allowed"
                  : item.destructive
                  ? "text-destructive hover:bg-destructive/10 cursor-pointer font-medium"
                  : "text-foreground hover:bg-secondary/20 cursor-pointer"
              }`,
              onclick: (e: MouseEvent) => {
                if (item.disabled) return;
                item.onClick?.(e);
                close();
              },
            },
            div(
              { class: "flex items-center gap-2" },
              item.icon ?? null,
              span(item.label),
            ),
            item.badge !== undefined
              ? span(
                  {
                    class:
                      "text-xs px-1.5 py-0.5 rounded bg-secondary/30 text-foreground-soft font-mono",
                  },
                  item.badge,
                )
              : null,
          );
        }),
      );
    },
  );
}
