// demo/pages/components.page.ts
import {
  van,
  Button,
  Badge,
  Table,
  toast,
  ModalBase,
  Spin,
  type TableColumn,
  type Router,
} from "vanui";
import { Header } from "../components/header.component.js";

const { div, h1, h2, p, span, section } = van.tags;

interface SampleUser {
  id: string;
  name: string;
  role: string;
  status: "active" | "pending" | "suspended";
  created: string;
}

export type ComponentsPageProps = {
  router?: Router;
};

export function ComponentsPage(_props: ComponentsPageProps = {}) {
  const modal = ModalBase();

  const sampleUsers = van.state<SampleUser[]>([
    { id: "usr_1", name: "Ana Morales", role: "Administrador", status: "active", created: "2026-01-10" },
    { id: "usr_2", name: "Carlos Ramos", role: "Desarrollador", status: "active", created: "2026-02-14" },
    { id: "usr_3", name: "Lucía Fernández", role: "Diseñadora", status: "pending", created: "2026-03-01" },
    { id: "usr_4", name: "David Ruiz", role: "Auditor", status: "suspended", created: "2026-03-12" },
    { id: "usr_5", name: "Elena Gómez", role: "Soporte", status: "active", created: "2026-04-05" },
  ]);

  const columns: TableColumn<SampleUser>[] = [
    { key: "name", header: "Usuario", sortable: true },
    { key: "role", header: "Rol", sortable: true },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const variantMap: Record<SampleUser["status"], "success" | "warning" | "danger"> = {
          active: "success",
          pending: "warning",
          suspended: "danger",
        };
        const textMap = { active: "Activo", pending: "Pendiente", suspended: "Suspendido" };
        return Badge({
          variant: variantMap[row.status],
          text: textMap[row.status],
          dot: true,
          size: "sm",
        });
      },
    },
    { key: "created", header: "Fecha Alta", sortable: true, align: "right" },
  ];

  return div(
    {
      id: "components-page",
      class: "space-y-10 py-4",
    },
    div(
      { class: "border-b border-border pb-5" },
      h1({ class: "text-3xl font-extrabold text-foreground" }, "Catálogo de Componentes VanUI"),
      p({ class: "text-foreground-soft text-sm mt-1" }, "Componentes reactivos, accesibles y modulares para VanJS."),
    ),

      // 1. Toast Notifications
      section(
        { class: "space-y-4" },
        h2({ class: "text-lg font-bold text-foreground" }, "1. Notificaciones Toast (toast.*)"),
        div(
          { class: "flex flex-wrap gap-3" },
          Button(
            {
              variant: "primary",
              onclick: () => toast.success("Operación realizada con éxito", { title: "Completado" }),
            },
            "Éxito",
          ),
          Button(
            {
              variant: "secondary",
              onclick: () => toast.info("Hay una nueva actualización disponible", { title: "Novedad" }),
            },
            "Información",
          ),
          Button(
            {
              variant: "secondary",
              onclick: () => toast.warning("La sesión expirará en 5 minutos", { title: "Aviso" }),
            },
            "Advertencia",
          ),
          Button(
            {
              variant: "primary",
              onclick: () => toast.error("No se pudo conectar con el servidor", { title: "Fallo" }),
            },
            "Error",
          ),
        ),
      ),

      // 2. Badges
      section(
        { class: "space-y-4" },
        h2({ class: "text-lg font-bold text-foreground" }, "2. Badges & Tags (Badge)"),
        div(
          { class: "flex flex-wrap items-center gap-3" },
          Badge({ text: "Primary", variant: "primary" }),
          Badge({ text: "Success", variant: "success", dot: true }),
          Badge({ text: "Warning", variant: "warning", dot: true }),
          Badge({ text: "Danger", variant: "danger", dot: true }),
          Badge({ text: "Secondary", variant: "secondary" }),
          Badge({ text: "Outline", variant: "outline" }),
          Badge({ text: "Grande", variant: "primary", size: "lg" }),
        ),
      ),

      // 3. Data Table
      section(
        { class: "space-y-4" },
        h2({ class: "text-lg font-bold text-foreground" }, "3. Data Table Reactiva (Table)"),
        Table({
          columns,
          data: sampleUsers,
          pageSize: 3,
        }),
      ),

      // 4. Modal & Spin
      section(
        { class: "space-y-4" },
        h2({ class: "text-lg font-bold text-foreground" }, "4. Modal & Spinner"),
        div(
          { class: "flex items-center gap-4" },
          Button(
            {
              variant: "secondary",
              onclick: () => {
                modal.set({
                  header: () => div({ class: "text-lg font-bold" }, "Modal Demostrativo VanUI"),
                  body: () => div({ class: "py-2 text-sm text-foreground-soft" }, "Este modal es completamente reactivo y se monta/desmonta con estados nativos de VanJS."),
                  footer: () =>
                    div(
                      { class: "flex justify-end gap-2" },
                      Button(
                        {
                          variant: "secondary",
                          onclick: () => modal.close(),
                        },
                        "Cerrar",
                      ),
                      Button(
                        {
                          variant: "primary",
                          onclick: () => {
                            modal.close();
                            toast.success("Acción confirmada desde el modal");
                          },
                        },
                        "Aceptar",
                      ),
                    ),
                });
                modal.open();
              },
            },
            "Abrir Modal de Prueba",
          ),
          Spin("Cargando demostración..."),
        ),
        modal.dom(),
      ),
    );
}
