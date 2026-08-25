import van, { type State } from "vanjs-core";

const { div, table, thead, tbody, tr, th, td, span, button } = van.tags;

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (row: T, index: number) => any;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface TableProps<T = any> {
  id?: string;
  columns: TableColumn<T>[];
  data: T[] | State<T[]>;
  keyField?: string;
  emptyText?: string;
  pageSize?: number;
  class?: string;
}

export function Table<T extends Record<string, any> = any>(props: TableProps<T>) {
  const currentPage = van.state<number>(1);
  const sortKey = van.state<string | null>(null);
  const sortDirection = van.state<"asc" | "desc">("asc");

  const getData = (): T[] => {
    return Array.isArray(props.data) ? props.data : props.data.val;
  };

  const handleSort = (key: string) => {
    if (sortKey.val === key) {
      sortDirection.val = sortDirection.val === "asc" ? "desc" : "asc";
    } else {
      sortKey.val = key;
      sortDirection.val = "asc";
    }
  };

  return div(
    {
      ...(props.id ? { id: props.id } : {}),
      class: `w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm ${props.class ?? ""}`,
    },
    () => {
      let rows = [...getData()];

      // Ordenamiento
      if (sortKey.val) {
        const key = sortKey.val;
        const dir = sortDirection.val === "asc" ? 1 : -1;
        rows.sort((a, b) => {
          const valA = a[key];
          const valB = b[key];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          return valA > valB ? dir : -dir;
        });
      }

      // Paginación
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

      return div(
        { class: "flex flex-col" },
        table(
          { class: "w-full text-left text-sm border-collapse" },
          thead(
            { class: "border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider" },
            tr(
              props.columns.map((col) => {
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return th(
                  {
                    class: `px-4 py-3.5 ${alignClass} ${col.sortable ? "cursor-pointer select-none hover:text-white transition-colors" : ""}`,
                    ...(col.width ? { style: `width: ${col.width}` } : {}),
                    ...(col.sortable ? { onclick: () => handleSort(col.key) } : {}),
                  },
                  div(
                    { class: `inline-flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}` },
                    span(col.header),
                    col.sortable
                      ? span(
                          { class: "text-[10px] text-slate-500 font-mono" },
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
            { class: "divide-y divide-slate-800/60 text-slate-200" },
            displayRows.length === 0
              ? tr(
                  td(
                    {
                      colspan: props.columns.length,
                      class: "px-4 py-8 text-center text-slate-500 text-sm italic",
                    },
                    props.emptyText ?? "No hay datos disponibles",
                  ),
                )
              : displayRows.map((row, index) =>
                  tr(
                    {
                      class: "hover:bg-slate-800/30 transition-colors",
                    },
                    props.columns.map((col) => {
                      const alignClass =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";

                      return td(
                        { class: `px-4 py-3.5 ${alignClass}` },
                        col.render ? col.render(row, index) : (row[col.key] ?? "-"),
                      );
                    }),
                  ),
                ),
          ),
        ),
        pageSize > 0 && totalItems > 0
          ? div(
              {
                class:
                  "flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/30",
              },
              span(
                `Mostrando ${(currentPage.val - 1) * pageSize + 1} - ${Math.min(
                  currentPage.val * pageSize,
                  totalItems,
                )} de ${totalItems}`,
              ),
              div(
                { class: "flex items-center gap-1.5" },
                button(
                  {
                    type: "button",
                    disabled: () => currentPage.val <= 1,
                    class:
                      "px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors",
                    onclick: () => (currentPage.val = Math.max(1, currentPage.val - 1)),
                  },
                  "← Anterior",
                ),
                span({ class: "px-2 font-medium text-slate-300" }, () => `${currentPage.val} / ${totalPages}`),
                button(
                  {
                    type: "button",
                    disabled: () => currentPage.val >= totalPages,
                    class:
                      "px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors",
                    onclick: () => (currentPage.val = Math.min(totalPages, currentPage.val + 1)),
                  },
                  "Siguiente →",
                ),
              ),
            )
          : null,
      );
    },
  );
}
