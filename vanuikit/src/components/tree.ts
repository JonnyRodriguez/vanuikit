import van, { type ChildDom, type State, type ValidChildDomValue } from "vanjs-core";
import { cx } from "../util.js";
import { t } from "../i18n.js";
import type { ToggleText } from "./checkbox.js";

/**
 * A node in a hierarchical tree. Children are nested, so a node with
 * `children` renders a chevron and an expand/collapse toggle.
 */
export interface TreeNode {
  id: string | number;
  /** Row label: plain text or a reactive State (leaf binding). */
  label: ToggleText;
  /** Optional trailing label (count, status, ...). */
  badge?: ToggleText;
  /** Nested children (recursive). */
  children?: TreeNode[];
  /**
   * Per-node slot rendered at the end of the row (edit/delete/...).
   * Receives the node so handlers can close over its id.
   */
  actions?: (node: TreeNode) => ValidChildDomValue;
}

export interface TreeOptions {
  /** Nodes as a plain array or a reactive State rebuilt when data changes. */
  nodes: TreeNode[] | State<TreeNode[]>;
  /**
   * When provided, every node gains an inline "add child" control: a small
   * `+` button on hover/focus that opens a text input right below the row
   * (no modal). Submitting calls `onAddChild(node, name)`.
   */
  onAddChild?: (node: TreeNode, name: string) => void;
  /** Placeholder for the inline add-child input. */
  addChildPlaceholder?: string;
  /**
   * Empty hint shown when there are no nodes. Pass `false` to hide it
   * (when the host renders its own empty state).
   */
  emptyText?: string | State<string> | false;
  /** Ids expanded on mount (also honored when `expandAll` is false). */
  defaultExpanded?: (string | number)[];
  /**
   * Start fully expanded: every parent node is open until the user collapses it
   * (default true). Set false to start collapsed and rely only on
   * `defaultExpanded`.
   */
  expandAll?: boolean;
  class?: string;
  [key: string]: any;
}

const INDENT = 18;

// Resolves `defaultExpanded` whether given as a plain array or a State.
const resolveIds = (v?: (string | number)[] | State<(string | number)[]>): (string | number)[] =>
  v && typeof v === "object" && "val" in v ? (v as State<(string | number)[]>).val : v ?? [];

let nextId = 0;

/**
 * Accessible hierarchical tree: recursive indentation, expand/collapse with
 * `role="tree"`/`role="treeitem"` and `aria-expanded`, a per-node action slot,
 * and an optional inline add-child mode. Expansion is keyed by node id so it
 * survives data reloads (ids must be stable).
 */
export const Tree = (props: TreeOptions): ChildDom => {
  const { div, button, span, input } = van.tags;
  const uid = `vanuikit-tree-${nextId++}`;
  const expanded = van.state<Set<string | number>>(new Set(resolveIds(props.defaultExpanded)));
  const touched = van.state<Set<string | number>>(new Set());
  const addingTo = van.state<string | number | null>(null);

  const getNodes = (): TreeNode[] =>
    Array.isArray(props.nodes) ? props.nodes : props.nodes.val;

  // With expandAll (default), every parent starts open until the user
  // collapses it; `touched` records manual toggles so reloads don't undo them.
  const isNodeOpen = (id: string | number, hasChildren: boolean): boolean => {
    if (!hasChildren) return false;
    if (props.expandAll === false) return expanded.val.has(id);
    return !touched.val.has(id) || expanded.val.has(id);
  };

  const toggle = (id: string | number) => {
    const wasOpen = isNodeOpen(id, true);
    const t = new Set(touched.val);
    t.add(id);
    touched.val = t;
    // Flip the *effective* open state (default-open vs seeded differ).
    const s = new Set(expanded.val);
    if (wasOpen) {
      s.delete(id);
    } else {
      s.add(id);
    }
    expanded.val = s;
  };

  const renderAddForm = (parent: TreeNode, depth: number): ValidChildDomValue => {
    const childLabel = typeof parent.label === "object" && "val" in parent.label ? parent.label.val : parent.label;
    const submit = () => {
      const name = nameEl.value.trim();
      if (!name) return;
      addingTo.val = null;
      props.onAddChild?.(parent, name);
    };
    const cancel = () => {
      addingTo.val = null;
    };
    const nameEl = input({
      type: "text",
      class:
        "flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-focus",
      placeholder: props.addChildPlaceholder ?? t("tree.addChildPlaceholder", "New child name"),
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === "Enter") submit();
        else if (e.key === "Escape") cancel();
      },
    });
    return div(
      {
        class: "flex items-center gap-1.5 mt-1 pr-2",
        style: `margin-left: ${(depth + 1) * INDENT}px`,
        "aria-label": t("tree.addChildLabel", "Add child to {name}", { name: childLabel }),
      },
      nameEl,
      button(
        {
          type: "button",
          "aria-label": t("tree.confirmAdd", "Confirm"),
          class:
            "h-7 px-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 cursor-pointer shrink-0",
          onclick: submit,
        },
        "✓",
      ),
      button(
        {
          type: "button",
          "aria-label": t("tree.cancelAdd", "Cancel"),
          class:
            "h-7 px-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20 text-xs cursor-pointer shrink-0",
          onclick: cancel,
        },
        "✕",
      ),
    );
  };

  const renderNode = (node: TreeNode, depth: number): ChildDom => {
    const hasChildren = !!(node.children && node.children.length);
    const isOpen = () => isNodeOpen(node.id, hasChildren);
    const isAdding = () => addingTo.val === node.id;
    const childLabel = typeof node.label === "object" && "val" in node.label ? node.label.val : node.label;

    const row = div(
      {
        class:
          "group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary/10",
        role: "treeitem",
        "aria-level": String(depth + 1),
        ...(hasChildren ? { "aria-expanded": () => (isOpen() ? "true" : "false") } : {}),
      },
      depth > 0 ? div({ style: `width: ${depth * INDENT}px`, class: "shrink-0" }) : null,
      hasChildren
        ? button(
            {
              type: "button",
              "aria-hidden": "true",
              class: () =>
                cx(
                  "w-5 h-5 shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-transform duration-200 cursor-pointer",
                  isOpen() ? "rotate-90" : "",
                ),
              onclick: () => toggle(node.id),
            },
            "▸",
          )
        : span({ class: "w-5 h-5 shrink-0" }),
      span({ class: "font-medium text-foreground truncate min-w-0" }, node.label),
      node.badge != null ? span({ class: "text-xs text-muted-foreground shrink-0" }, node.badge) : null,
      div(
        { class: "ml-auto flex items-center gap-1.5 shrink-0" },
        node.actions ? node.actions(node) : null,
        props.onAddChild
          ? button(
              {
                type: "button",
                "aria-label": t("tree.addChildAria", "Add child"),
                title: t("tree.addChildAria", "Add child"),
                class:
                  "w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer",
                onclick: () => (addingTo.val = node.id),
              },
              "+",
            )
          : null,
      ),
    );

    const childrenRegion = hasChildren
      ? div(
          { class: () => (isOpen() ? "" : "hidden"), role: "group" },
          node.children!.map((child) => renderNode(child, depth + 1)),
        )
      : null;

    const addRegion =
      props.onAddChild !== undefined
        ? div(
            { class: "mb-0.5" },
            () => (isAdding() ? renderAddForm(node, depth) : div()),
          )
        : null;

    return div({ class: "vui-tree-node" }, row, childrenRegion, addRegion);
  };

  return div(
    {
      id: uid,
      role: "tree",
      class: cx("flex flex-col gap-0.5 rounded-xl border border-border bg-background p-2", props.class),
    },
    () => {
      const nodes = getNodes();
      if (!nodes.length) {
        if (props.emptyText === false) return div();
        return div(
          { class: "px-2 py-4 text-sm text-muted-foreground" },
          props.emptyText ?? t("tree.empty", "No items"),
        );
      }
      return div(
        { class: "flex flex-col gap-0.5" },
        nodes.map((n) => renderNode(n, 0)),
      );
    },
  );
};
