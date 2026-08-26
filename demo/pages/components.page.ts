// demo/pages/components.page.ts
import {
  van,
  Button,
  Badge,
  DataGrid,
  Tabs,
  SelectDropdown,
  DropdownMenu,
  ConfirmDialog,
  confirmDialog,
  toast,
  ModalBase,
  Spin,
  type TableColumn,
  type Router,
} from "vanui";
import { i18n } from "../shared/i18n.config.js";
import { theme } from "../shared/theme.config.js";

const { div, h1, h2, h3, p, span, section } = van.tags;

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

  // State para SelectDropdown
  const selectedFramework = van.state("vanjs");
  const selectedCountry = van.state("es");

  // State para DataGrid
  const sampleUsers = van.state<SampleUser[]>([
    { id: "usr_1", name: "Ana Morales", role: "Administrador", status: "active", created: "2026-01-10" },
    { id: "usr_2", name: "Carlos Ramos", role: "Desarrollador", status: "active", created: "2026-02-14" },
    { id: "usr_3", name: "Lucía Fernández", role: "Diseñadora", status: "pending", created: "2026-03-01" },
    { id: "usr_4", name: "David Ruiz", role: "Auditor", status: "suspended", created: "2026-03-12" },
    { id: "usr_5", name: "Elena Gómez", role: "Soporte", status: "active", created: "2026-04-05" },
    { id: "usr_6", name: "Marcos Varela", role: "DevOps", status: "active", created: "2026-05-20" },
  ]);

  const selectedUsers = van.state<SampleUser[]>([]);

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
      class: "space-y-12 py-4",
    },
    // Cabecera Principal
    div(
      { class: "border-b border-border pb-5" },
      h1({ class: "text-3xl font-extrabold text-foreground" }, i18n.t("components.title")),
      p({ class: "text-foreground-soft text-sm mt-1" }, i18n.t("components.subtitle")),
    ),

    // 1. Theme & i18n Control Section
    section(
      { class: "space-y-4 p-5 rounded-2xl border border-border bg-secondary/10 shadow-sm" },
      h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.themeSection")),
      p({ class: "text-sm text-foreground-soft" }, "Gestión de estado global sin overhead: alternancia instantánea y sincronización automática."),
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
        Button(
          {
            variant: "primary",
            onclick: () => i18n.setLocale("fr"),
          },
          "🇫🇷 Français",
        ),
      ),
    ),

    // 2. Tabs (Pestañas accesibles y reactivas)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.tabs")),
        Badge({ text: "Accesible ARIA", variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, "Organiza contenido denso con soporte para flechas de teclado (←/→, Home, End), badges y múltiples variantes."),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-6" },
        // Variante Underline
        Tabs({
          id: "demo-tabs-underline",
          variant: "underline",
          items: [
            {
              id: "overview",
              label: "Resumen General",
              badge: "Nuevo",
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, "📊 Panel de Rendimiento"),
                p({ class: "text-foreground-soft leading-relaxed" }, "VanUI permite renderizar vistas SPA reactivas con un bundle ultra liviano (~1.5kB de VanJS core) sin VDOM."),
              ),
            },
            {
              id: "activity",
              label: "Actividad",
              badge: 4,
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, "⚡ Registro de Eventos"),
                p({ class: "text-foreground-soft" }, "Se registraron 4 operaciones exitosas en las últimas 24 horas."),
              ),
            },
            {
              id: "security",
              label: "Seguridad",
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, "🔒 Autenticación y Cifrado"),
                p({ class: "text-foreground-soft" }, "Sesiones protegidas con guards síncronos y asíncronos en el enrutador SPA."),
              ),
            },
            {
              id: "disabled-tab",
              label: "Deshabilitado",
              disabled: true,
              content: div("No accesible"),
            },
          ],
        }),
      ),
    ),

    // 3. Select / Dropdowns Accesibles
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.dropdowns")),
        Badge({ text: "Listbox + Menu", variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, "Selectores personalizados con navegación completa por teclado, búsqueda integrada y menús de acciones contextuales."),
      div(
        { class: "grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        // Select con búsqueda
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, "Select con Búsqueda"),
          SelectDropdown({
            id: "framework-select",
            searchable: true,
            searchPlaceholder: "Buscar framework...",
            value: selectedFramework,
            options: [
              { value: "vanjs", label: "VanJS", description: "Ultra lightweight (1.0kB)" },
              { value: "react", label: "React", description: "Popular ecosystem" },
              { value: "vue", label: "Vue", description: "Progressive framework" },
              { value: "svelte", label: "Svelte", description: "Cybernetically enhanced" },
            ],
            onChange: (val) => toast.info(`Seleccionado: ${val}`),
          }),
          p({ class: "text-xs text-muted" }, () => `Valor actual: ${selectedFramework.val}`),
        ),

        // Select de Países
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, "Selector con Iconos"),
          SelectDropdown({
            id: "country-select",
            value: selectedCountry,
            options: [
              { value: "es", label: "España", icon: span("🇪🇸") },
              { value: "us", label: "Estados Unidos", icon: span("🇺🇸") },
              { value: "fr", label: "Francia", icon: span("🇫🇷") },
              { value: "mx", label: "México", icon: span("🇲🇽") },
              { value: "ar", label: "Argentina", icon: span("🇦🇷") },
            ],
            onChange: (val) => toast.info(`País seleccionado: ${val}`),
          }),
        ),

        // DropdownMenu contextual
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, "Menú de Acciones"),
          div(
            { class: "pt-1" },
            DropdownMenu({
              trigger: (isOpen) =>
                Button(
                  { variant: "secondary" },
                  div({ class: "flex items-center gap-2" }, span("Acciones"), span({ class: () => isOpen.val ? "rotate-180 transition-transform" : "transition-transform" }, "▾")),
                ),
              items: [
                { type: "header", label: "Opciones de cuenta" },
                { label: "Ver Perfil", icon: span("👤"), onClick: () => toast.info("Navegando al perfil") },
                { label: "Configuración", icon: span("⚙️"), badge: "Pro", onClick: () => toast.info("Abriendo configuración") },
                { type: "divider" },
                { label: "Cerrar Sesión", icon: span("🚪"), destructive: true, onClick: () => toast.warning("Sesión cerrada") },
              ],
            }),
          ),
        ),
      ),
    ),

    // 4. ConfirmDialog (Diálogos de confirmación)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.confirmDialogs")),
        Badge({ text: "Imperativo & Declarativo", variant: "warning", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, "Abstracción sobre Modal para confirmaciones críticas con soporte para Promises, estados de carga y variantes (danger, warning, primary)."),
      div(
        { class: "flex flex-wrap items-center gap-4 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "destructive",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: "¿Eliminar cuenta permanentemente?",
                message: "Esta acción borrará todos tus datos y transacciones asociadas sin posibilidad de recuperación.",
                variant: "danger",
                confirmText: "Sí, eliminar cuenta",
                cancelText: "Cancelar",
              });

              if (confirmed) {
                toast.error("Cuenta eliminada satisfactoriamente");
              } else {
                toast.info("Acción cancelada por el usuario");
              }
            },
          },
          "🗑️ Diálogo Peligro (Imperativo)",
        ),
        Button(
          {
            variant: "secondary",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: "¿Publicar cambios?",
                message: "Los cambios se aplicarán inmediatamente a todos los usuarios en producción.",
                variant: "primary",
                confirmText: "Publicar ahora",
              });

              if (confirmed) {
                toast.success("Cambios publicados en producción");
              }
            },
          },
          "🚀 Diálogo Informativo",
        ),
      ),
    ),

    // 5. DataGrid / Table con búsqueda, ordenamiento y selección
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.tables")),
        Badge({ text: "Búsqueda + Sort + Paginación", variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, "Tabla de datos reactiva con ordenamiento bidireccional por columna, búsqueda instantánea, selección múltiple y paginación."),
      DataGrid({
        columns,
        data: sampleUsers,
        pageSize: 4,
        searchable: true,
        searchPlaceholder: "Buscar por nombre o rol...",
        selectable: true,
        selectedRows: selectedUsers,
        onSelectionChange: (selected) => {
          if (selected.length > 0) {
            toast.info(`${selected.length} usuarios seleccionados`, { durationMs: 1500 });
          }
        },
      }),
    ),

    // 6. Badges & Toasts
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.badges")),
      div(
        { class: "flex flex-wrap items-center gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Badge({ text: "Primary", variant: "primary" }),
        Badge({ text: "Success", variant: "success", dot: true }),
        Badge({ text: "Warning", variant: "warning", dot: true }),
        Badge({ text: "Danger", variant: "danger", dot: true }),
        Badge({ text: "Secondary", variant: "secondary" }),
        Badge({ text: "Outline", variant: "outline" }),
        Badge({ text: "Grande", variant: "primary", size: "lg" }),
      ),
    ),

    // 7. Notificaciones Toast
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.toasts")),
      div(
        { class: "flex flex-wrap gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
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

    // 8. Modal Clásico & Spinner
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.modals")),
      div(
        { class: "flex items-center gap-4 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "secondary",
            onclick: () => {
              modal.set({
                header: () => div({ class: "text-lg font-bold" }, "Modal Básico VanUI"),
                body: () => div({ class: "py-2 text-sm text-foreground-soft leading-relaxed" }, "Este modal es completamente reactivo y se monta/desmonta con estados nativos de VanJS."),
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
          "Abrir Modal Básico",
        ),
        Spin("Indicador de carga..."),
      ),
      modal.dom(),
    ),
  );
}
