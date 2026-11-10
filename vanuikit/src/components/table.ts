import van, { type State, type ChildDom } from "vanjs-core";
import { t, raw } from "../i18n.js";
import { Icon } from "./icon.js";

const { div, table, thead, tbody, tr, th, td, span, button, input } = van.tags;

export interface TableColumn<T = any> {
  key: string;
  header: string | State<string>;
  render?: (row: T, index: number) => ChildDom;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  compare?: (a: T, b: T) => number;
}

export interface TableProps<T = any> {
  id?: string;
  columns: TableColumn<T>[];
  data: T[] | State<T[]>;
  keyField?: string;
  emptyText?: string | State<string>;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string | State<string>;
  selectable?: boolean;
  selectedRows?: State<T[]>;
  onSelectionChange?: (selected: T[]) => void;
  class?: string;
}

export function Table<T extends Record<string, any> = any>(props: TableProps<T>) {
  const currentPage = van.state<number>(1);
  const sortKey = van.state<string | null>(null);
  const sortDirection = van.state<"asc" | "desc">("asc");
  const searchQuery = van.state<string>("");
  const internalSelected = van.state<T[]>([]);
  const selectedRows = props.selectedRows ?? internalSelected;

  const getData = (): T[] => {
    return Array.isArray(props.data) ? props.data : props.data.val;
  };

  const getKey = (row: T, index: number): string | number => {
    if (props.keyField && row[props.keyField] !== undefined) {
      return row[props.keyField];
    }
    return row.id ?? index;
  };

  const handleSort = (key: string) => {
    if (sortKey.val === key) {
      sortDirection.val = sortDirection.val === "asc" ? "desc" : "asc";
    } else {
      sortKey.val = key;
      sortDirection.val = "asc";
    }
  };

  const toggleSelectRow = (row: T) => {
    const key = props.keyField ?? "id";
    const current = [...selectedRows.val];
    const existsIdx = current.findIndex((r) =>
      key in r && key in row ? r[key] === row[key] : r === row,
    );

    if (existsIdx >= 0) {
      current.splice(existsIdx, 1);
    } else {
      current.push(row);
    }
    selectedRows.val = current;
    props.onSelectionChange?.(current);
  };

  const toggleSelectAll = (displayRows: T[]) => {
    const key = props.keyField ?? "id";
    const allSelected = displayRows.every((row) =>
      selectedRows.val.some((r) =>
        key in r && key in row ? r[key] === row[key] : r === row,
      ),
    );

    if (allSelected) {
      // Unselect display rows
      const current = selectedRows.val.filter(
        (r) =>
          !displayRows.some((dr) =>
            key in r && key in dr ? r[key] === dr[key] : r === dr,
          ),
      );
      selectedRows.val = current;
      props.onSelectionChange?.(current);
    } else {
      // Select all display rows
      const current = [...selectedRows.val];
      for (const dr of displayRows) {
        if (
          !current.some((r) =>
            key in r && key in dr ? r[key] === dr[key] : r === dr,
          )
        ) {
          current.push(dr);
        }
      }
      selectedRows.val = current;
      props.onSelectionChange?.(current);
    }
  };

  // La barra de búsqueda vive FUERA del contenedor reactivo y el input es
  // DESCONTROLADO (sin binding `value`): VanJS nunca escribe sobre el campo, así
  // que solo el DOM es dueño del texto y del caret (nadie puede re-crearlo ni
  // interferir con el foco al filtrar). El filtro solo LEE `searchQuery`, que se
  // actualiza vía `oninput`. El cuerpo de la tabla + paginación se re-renderizan
  // al filtrar, pero la searchbar queda intacta.
  const searchBar = props.searchable
    ? div(
        {
          class:
            "flex items-center justify-between gap-3 p-3.5 border-b border-border bg-secondary/5",
        },
        div(
          { class: "relative flex-1 max-w-sm" },
          input({
            type: "text",
            placeholder:
              props.searchPlaceholder ??
              t("table.searchPlaceholder", "Search the table..."),
            class:
              "w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-focus transition-all",
            oninput: (e: Event) => {
              searchQuery.val = (e.target as HTMLInputElement).value;
              currentPage.val = 1;
            },
          }),
          span(
            { class: "absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" },
            Icon({ name: "search", class: "size-3.5" }),
          ),
        ),
        props.selectable
          ? () =>
              selectedRows.val.length > 0
                ? span(
                    { class: "text-xs text-primary font-semibold" },
                    t("table.selectedCount", "{count} selected", { count: selectedRows.val.length }),
                  )
                : null
          : null,
      )
    : null;

  return div(
    {
      ...(props.id ? { id: props.id } : {}),
      class: `w-full rounded-xl border border-border bg-background shadow-sm overflow-hidden ${
        props.class ?? ""
      }`,
    },
    searchBar,
    () => {
      let rows = [...getData()];

      // Search / filter
      if (props.searchable && searchQuery.val.trim()) {
        const q = searchQuery.val.toLowerCase();
        rows = rows.filter((row) =>
          props.columns.some((col) => {
            const val = row[col.key];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
          }),
        );
      }

      // Sorting
      if (sortKey.val) {
        const key = sortKey.val;
        const colDef = props.columns.find((c) => c.key === key);
        const dir = sortDirection.val === "asc" ? 1 : -1;

        if (colDef?.compare) {
          const comp = colDef.compare;
          rows.sort((a, b) => comp(a, b) * dir);
        } else {
          rows.sort((a, b) => {
            const valA = a[key];
            const valB = b[key];
            if (valA === valB) return 0;
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            if (typeof valA === "number" && typeof valB === "number") {
              return (valA - valB) * dir;
            }
            return String(valA).localeCompare(String(valB)) * dir;
          });
        }
      }

      // Pagination
      const totalItems = rows.length;
      const pageSize = props.pageSize ?? 0;
      let totalPages = 1;
      let displayRows = rows;

      if (pageSize > 0) {
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (currentPage.val > totalPages) currentPage.val = totalPages;
        const start = (currentPage.val - 1) * pageSize;
        displayRows = rows.slice(start, start + pageSize);
      }

      const isAllSelected =
        displayRows.length > 0 &&
        displayRows.every((row) => {
          const key = props.keyField ?? "id";
          return selectedRows.val.some((r) =>
            key in r && key in row ? r[key] === row[key] : r === row,
          );
        });

      return div(
        { class: "flex flex-col w-full" },
        // Table with responsive horizontal scroll
        div(
          { class: "w-full overflow-x-auto" },
          table(
            { class: "w-full text-left text-sm border-collapse" },
            thead(
              {
                class:
                  "border-b border-border bg-secondary/15 text-foreground-soft text-xs font-semibold uppercase tracking-wider",
              },
              tr(
                props.selectable
                  ? th(
                      {
                        class: "w-10 px-4 py-3.5 text-center",
                        "aria-label": t("table.selectAll", "Select all rows"),
                      },
                      input({
                        type: "checkbox",
                        checked: isAllSelected,
                        class: "rounded border-border text-primary cursor-pointer",
                        "aria-label": t("table.selectAll", "Select all rows"),
                        onchange: () => toggleSelectAll(displayRows),
                      }),
                    )
                  : null,
                props.columns.map((col) => {
                  const alignClass =
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left";

                  return th(
                    {
                      class: `px-4 py-3.5 ${alignClass} ${
                        col.sortable
                          ? "cursor-pointer select-none hover:text-foreground hover:bg-secondary/15 transition-colors"
                          : ""
                      }`,
                      ...(col.width ? { style: `width: ${col.width}` } : {}),
                      ...(col.sortable ? { onclick: () => handleSort(col.key) } : {}),
                    },
                    div(
                      {
                        class: `inline-flex items-center gap-1.5 ${
                          col.align === "right"
                            ? "justify-end"
                            : col.align === "center"
                            ? "justify-center"
                            : "justify-start"
                        }`,
                      },
                      span(col.header),
                      col.sortable
                        ? span(
                            {
                              class: `text-xs font-mono transition-colors ${
                                sortKey.val === col.key
                                  ? "text-primary font-bold"
                                  : "text-muted"
                              }`,
                            },
                            sortKey.val === col.key
                              ? sortDirection.val === "asc"
                                ? "▲"
                                : "▼"
                              : "⇅",
                          )
                        : null,
                    ),
                  );
                }),
              ),
            ),
            tbody(
              { class: "divide-y divide-border text-foreground" },
              displayRows.length === 0
                ? tr(
                    td(
                      {
                        colspan: props.columns.length + (props.selectable ? 1 : 0),
                        class: "px-4 py-8 text-center text-muted text-sm italic",
                      },
                      props.emptyText ?? t("table.emptyText", "No data available"),
                    ),
                  )
                : displayRows.map((row, index) => {
                    const key = props.keyField ?? "id";
                    const isSelected = selectedRows.val.some((r) =>
                      key in r && key in row ? r[key] === row[key] : r === row,
                    );

                    return tr(
                      {
                        key: getKey(row, index),
                        class: `transition-colors ${
                          isSelected
                            ? "bg-primary/10 hover:bg-primary/15 font-medium"
                            : "hover:bg-secondary/10"
                        }`,
                      },
                      props.selectable
                        ? td(
                            { class: "w-10 px-4 py-3.5 text-center" },
                            input({
                              type: "checkbox",
                              checked: isSelected,
                              class: "rounded border-border text-primary cursor-pointer",
                              "aria-label": t("table.selectRow", "Select row {index}", {
                                index: String(index + 1),
                              }),
                              onchange: () => toggleSelectRow(row),
                            }),
                          )
                        : null,
                      props.columns.map((col) => {
                        const alignClass =
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left";

                        return td(
                          { class: `px-4 py-3.5 ${alignClass}` },
                          col.render
                            ? col.render(row, index)
                            : (row[col.key] ?? "-"),
                        );
                      }),
                    );
                  }),
            ),
          ),
        ),
        // Pagination
        pageSize > 0 && totalItems > 0
          ? div(
              {
                class:
                  "flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border text-xs text-foreground-soft bg-secondary/5",
              },
              span(
                () =>
                  raw("table.showing", "Showing {start} - {end} of {total}", {
                      start: (currentPage.val - 1) * pageSize + 1,
                      end: Math.min(currentPage.val * pageSize, totalItems),
                      total: totalItems,
                    }),
              ),
              div(
                { class: "flex items-center gap-1.5" },
                button(
                  {
                    type: "button",
                    disabled: () => currentPage.val <= 1,
                    class:
                      "px-2.5 py-1 rounded-md border border-border bg-background hover:bg-secondary/20 disabled:opacity-40 disabled:pointer-events-none text-foreground transition-colors cursor-pointer",
                    onclick: () => (currentPage.val = Math.max(1, currentPage.val - 1)),
                  },
                  t("table.prev", "← Previous"),
                ),
                span(
                  { class: "px-2 font-medium text-foreground" },
                  () => `${currentPage.val} / ${totalPages}`,
                ),
                button(
                  {
                    type: "button",
                    disabled: () => currentPage.val >= totalPages,
                    class:
                      "px-2.5 py-1 rounded-md border border-border bg-background hover:bg-secondary/20 disabled:opacity-40 disabled:pointer-events-none text-foreground transition-colors cursor-pointer",
                    onclick: () =>
                      (currentPage.val = Math.min(totalPages, currentPage.val + 1)),
                  },
                  t("table.next", "Next →"),
                ),
              ),
            )
          : null,
      );
    },
  );
}

/**
 * DataGrid — Semantic alias with advanced configuration for full data tables.
 */
export const DataGrid = Table;
