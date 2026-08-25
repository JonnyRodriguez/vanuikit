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
import { i18n } from "../shared/i18n.config.js";
import { theme } from "../shared/theme.config.js";

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
      h1({ class: "text-3xl font-extrabold text-foreground" }, i18n.t("components.title")),
      p({ class: "text-foreground-soft text-sm mt-1" }, i18n.t("components.subtitle")),
    ),

    // 1. Theme & i18n Control Section
    section(
      { class: "space-y-4 p-4 rounded-xl border border-border bg-secondary/10" },
      h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.themeSection")),
      p({ class: "text-sm text-foreground-soft" }, "Gestión de estado global sin overhead: alternancia instantánea y almacenamiento en LocalStorage."),
      div(
        { class: "flex flex-wrap items-center gap-3" },
        Button(
          {
            variant: "secondary",
            onclick: () => theme.setMode("light"),
          },
          "☀️ Modo Claro",
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => theme.setMode("dark"),
          },
          "🌙 Modo Oscuro",
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => theme.setMode("system"),
          },
          "💻 Seguir Sistema",
        ),
        span({ class: "text-border font-bold mx-1" }, "|"),
        Button(
          {
            variant: "primary",
            onclick: () => i18n.setLocale("es"),
          },
          "🇪🇸 Español",
        ),
        Button(
          {
            variant: "primary",
            onclick: () => i18n.setLocale("en"),
          },
          "🇺🇸 English",
        ),
      ),
    ),

    // 2. Toast Notifications
    section(
      { class: "space-y-4" },
      h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.toasts")),
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
            variant: "destructive",
            onclick: () => toast.error("No se pudo conectar con el servidor", { title: "Fallo" }),
          },
          "Error",
        ),
      ),
    ),

    // 3. Badges
    section(
      { class: "space-y-4" },
      h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.badges")),
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

    // 4. Data Table
    section(
      { class: "space-y-4" },
      h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.tables")),
      Table({
        columns,
        data: sampleUsers,
        pageSize: 3,
      }),
    ),

    // 5. Modal & Spin
    section(
      { class: "space-y-4" },
      h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.modals")),
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
