// demo/pages/components.page.ts
import {
  van,
  Button,
  Badge,
  DataGrid,
  Tabs,
  SelectDropdown,
  DropdownMenu,
  confirmDialog,
  toast,
  ModalBase,
  Spin,
  ThemeToggle,
  LocaleSelector,
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
    { key: "name", header: i18n.t("components.colUser", "Usuario"), sortable: true },
    { key: "role", header: i18n.t("components.colRole", "Rol"), sortable: true },
    {
      key: "status",
      header: i18n.t("components.colStatus", "Estado"),
      sortable: true,
      render: (row) => {
        const variantMap: Record<SampleUser["status"], "success" | "warning" | "danger"> = {
          active: "success",
          pending: "warning",
          suspended: "danger",
        };
        const textMap = {
          active: i18n.t("components.statusActive", "Activo"),
          pending: i18n.t("components.statusPending", "Pendiente"),
          suspended: i18n.t("components.statusSuspended", "Suspendido"),
        };
        return Badge({
          variant: variantMap[row.status],
          text: textMap[row.status],
          dot: true,
          size: "sm",
        });
      },
    },
    { key: "created", header: i18n.t("components.colCreated", "Fecha Alta"), sortable: true, align: "right" },
  ];

  return div(
    {
      id: "components-page",
      class: "space-y-12 py-4",
    },
    // Cabecera Principal
    div(
      { class: "border-b border-border pb-5" },
      h1({ class: "text-3xl font-extrabold text-foreground" }, i18n.t("components.title", "Catálogo de Componentes")),
      p({ class: "text-foreground-soft text-sm mt-1" }, i18n.t("components.subtitle", "Componentes interactivos construidos con VanJS y VanUI")),
    ),

    // 1. Theme & i18n Control Section (Componentes Embebidos de VanUI)
    section(
      { class: "space-y-5 p-6 rounded-2xl border border-border bg-secondary/10 shadow-sm" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.themeSection", "Gestión de Tema e Idioma")),
        Badge({ text: i18n.t("components.embeddedBadge", "Embebidos en VanUI"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.themeDesc", "Gestión de estado global sin overhead: alternancia instantánea y sincronización automática.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-2" },
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.themeToggleDemo", "ThemeToggle (Botón y Segmentado)")),
          div(
            { class: "flex flex-wrap items-center gap-3" },
            ThemeToggle({ theme, i18n, showLabel: true }),
            ThemeToggle({ theme, i18n, variant: "segmented" }),
          ),
        ),
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.localeSelectorDemo", "LocaleSelector (Select y Botones)")),
          div(
            { class: "flex flex-wrap items-center gap-3" },
            LocaleSelector({ i18n }),
            LocaleSelector({ i18n, variant: "buttons" }),
          ),
        ),
      ),
    ),

    // 2. Tabs (Pestañas accesibles y reactivas)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.tabs", "Pestañas (Tabs)")),
        Badge({ text: i18n.t("components.accessibleBadge", "Accesible ARIA"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.tabsDesc", "Organiza contenido denso con soporte para flechas de teclado (←/→, Home, End), badges y múltiples variantes.")),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-6" },
        // Variante Underline
        Tabs({
          id: "demo-tabs-underline",
          variant: "underline",
          items: [
            {
              id: "overview",
              label: i18n.t("components.tabOverview", "Resumen General"),
              badge: i18n.t("components.tabOverviewBadge", "Nuevo"),
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.perfTitle", "📊 Panel de Rendimiento")),
                p({ class: "text-foreground-soft leading-relaxed" }, i18n.t("components.perfBody", "VanUI permite renderizar vistas SPA reactivas con un bundle ultra liviano (~1.5kB de VanJS core) sin VDOM.")),
              ),
            },
            {
              id: "activity",
              label: i18n.t("components.tabActivity", "Actividad"),
              badge: 4,
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.eventsTitle", "⚡ Registro de Eventos")),
                p({ class: "text-foreground-soft" }, i18n.t("components.eventsBody", "Se registraron 4 operaciones exitosas en las últimas 24 horas.")),
              ),
            },
            {
              id: "security",
              label: i18n.t("components.tabSecurity", "Seguridad"),
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.securityTitle", "🔒 Autenticación y Cifrado")),
                p({ class: "text-foreground-soft" }, i18n.t("components.securityBody", "Sesiones protegidas con guards síncronos y asíncronos en el enrutador SPA.")),
              ),
            },
            {
              id: "disabled-tab",
              label: i18n.t("components.tabDisabled", "Deshabilitado"),
              disabled: true,
              content: div(i18n.t("components.disabledContent", "No accesible")),
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
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.dropdowns", "Select y Dropdowns Accesibles")),
        Badge({ text: i18n.t("components.listboxBadge", "Listbox + Menú"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.dropdownsDesc", "Selectores personalizados con navegación completa por teclado, búsqueda integrada y menús de acciones contextuales.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        // Select con búsqueda
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.searchSelect", "Select con Búsqueda")),
          SelectDropdown({
            id: "framework-select",
            searchable: true,
            searchPlaceholder: i18n.t("components.selectSearchPlaceholder", "Buscar framework..."),
            value: selectedFramework,
            options: [
              { value: "vanjs", label: "VanJS", description: i18n.t("components.frameworkVanjs", "Ultra lightweight (1.0kB)") },
              { value: "react", label: "React", description: i18n.t("components.frameworkReact", "Popular ecosystem") },
              { value: "vue", label: "Vue", description: i18n.t("components.frameworkVue", "Progressive framework") },
              { value: "svelte", label: "Svelte", description: i18n.t("components.frameworkSvelte", "Cybernetically enhanced") },
            ],
            onChange: (val) => toast.info(i18n.raw("components.selectedToast", "Seleccionado: {val}", { val })),
          }),
          p(
            { class: "text-xs text-muted" },
            // raw() lee currentLocale.val dentro del binding: reacciona al idioma y al valor.
            () => i18n.raw("components.currentValue", "Valor actual: {val}", { val: selectedFramework.val }),
          ),
        ),

        // Select de Países
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.countrySelect", "Selector con Iconos")),
          SelectDropdown({
            id: "country-select",
            value: selectedCountry,
            options: [
              { value: "es", label: i18n.t("components.countryEs", "España"), icon: span("🇪🇸") },
              { value: "us", label: i18n.t("components.countryUs", "Estados Unidos"), icon: span("🇺🇸") },
              { value: "fr", label: i18n.t("components.countryFr", "Francia"), icon: span("🇫🇷") },
              { value: "mx", label: i18n.t("components.countryMx", "México"), icon: span("🇲🇽") },
              { value: "ar", label: i18n.t("components.countryAr", "Argentina"), icon: span("🇦🇷") },
            ],
            onChange: (val) => toast.info(i18n.raw("components.countryToast", "País seleccionado: {val}", { val })),
          }),
        ),

        // DropdownMenu contextual
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.actionsMenu", "Menú de Acciones")),
          div(
            { class: "pt-1" },
            DropdownMenu({
              trigger: (isOpen) =>
                Button(
                  { variant: "secondary" },
                  div({ class: "flex items-center gap-2" }, span(i18n.t("components.actionsLabel", "Acciones")), span({ class: () => isOpen.val ? "rotate-180 transition-transform" : "transition-transform" }, "▾")),
                ),
              items: [
                { type: "header", label: i18n.raw("components.accountHeader", "Opciones de cuenta") },
                { label: i18n.t("components.viewProfile", "Ver Perfil"), icon: span("👤"), onClick: () => toast.info(i18n.raw("components.profileToast", "Navegando al perfil")) },
                { label: i18n.t("components.settings", "Configuración"), icon: span("⚙️"), badge: "Pro", onClick: () => toast.info(i18n.raw("components.settingsToast", "Abriendo configuración")) },
                { type: "divider" },
                { label: i18n.t("components.signOut", "Cerrar Sesión"), icon: span("🚪"), destructive: true, onClick: () => toast.warning(i18n.raw("components.signOutToast", "Sesión cerrada")) },
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
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.confirmDialogs", "Diálogos de Confirmación (ConfirmDialog)")),
        Badge({ text: i18n.t("components.imperativeBadge", "Imperativo & Declarativo"), variant: "warning", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.confirmDesc", "Abstracción sobre Modal para confirmaciones críticas con soporte para Promises, estados de carga y variantes.")),
      div(
        { class: "flex flex-wrap items-center gap-4 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "destructive",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: i18n.raw("components.deleteTitle", "¿Eliminar cuenta permanentemente?"),
                message: i18n.raw("components.deleteMsg", "Esta acción borrará todos tus datos y transacciones asociadas sin posibilidad de recuperación."),
                variant: "danger",
                confirmText: i18n.raw("components.deleteConfirm", "Sí, eliminar cuenta"),
                cancelText: i18n.raw("components.cancel", "Cancelar"),
              });

              if (confirmed) {
                toast.error(i18n.raw("components.deletedToast", "Cuenta eliminada satisfactoriamente"));
              } else {
                toast.info(i18n.raw("components.cancelledToast", "Acción cancelada por el usuario"));
              }
            },
          },
          i18n.t("components.dangerBtn", "🗑️ Diálogo Peligroso (Imperativo)"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: i18n.raw("components.publishTitle", "¿Publicar cambios?"),
                message: i18n.raw("components.publishMsg", "Los cambios se aplicarán inmediatamente a todos los usuarios en producción."),
                variant: "primary",
                confirmText: i18n.raw("components.publishConfirm", "Publicar ahora"),
              });

              if (confirmed) {
                toast.success(i18n.raw("components.publishedToast", "Cambios publicados en producción"));
              }
            },
          },
          i18n.t("components.infoBtn", "🚀 Diálogo Informativo"),
        ),
      ),
    ),

    // 5. DataGrid / Table con búsqueda, ordenamiento y selección
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.tables", "Tablas y DataGrid")),
        Badge({ text: i18n.t("components.searchSortBadge", "Búsqueda + Sort + Paginación"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.tablesDesc", "Tabla de datos reactiva con ordenamiento bidireccional por columna, búsqueda instantánea, selección múltiple y paginación.")),
      DataGrid({
        columns,
        data: sampleUsers,
        pageSize: 4,
        searchable: true,
        searchPlaceholder: i18n.t("components.tableSearchPlaceholder", "Buscar por nombre o rol..."),
        selectable: true,
        selectedRows: selectedUsers,
        onSelectionChange: (selected) => {
          if (selected.length > 0) {
            toast.info(i18n.raw("components.usersSelected", "{n} usuarios seleccionados", { n: selected.length }), { durationMs: 1500 });
          }
        },
      }),
    ),

    // 6. Badges & Toasts
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.badges", "Etiquetas (Badges)")),
      div(
        { class: "flex flex-wrap items-center gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Badge({ text: i18n.t("components.badgePrimary", "Primario"), variant: "primary" }),
        Badge({ text: i18n.t("components.badgeSuccess", "Éxito"), variant: "success", dot: true }),
        Badge({ text: i18n.t("components.badgeWarning", "Advertencia"), variant: "warning", dot: true }),
        Badge({ text: i18n.t("components.badgeDanger", "Peligro"), variant: "danger", dot: true }),
        Badge({ text: i18n.t("components.badgeSecondary", "Secundario"), variant: "secondary" }),
        Badge({ text: i18n.t("components.badgeOutline", "Contorno"), variant: "outline" }),
        Badge({ text: i18n.t("components.badgeLarge", "Grande"), variant: "primary", size: "lg" }),
      ),
    ),

    // 7. Notificaciones Toast
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.toasts", "Notificaciones (Toast)")),
      div(
        { class: "flex flex-wrap gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "primary",
            onclick: () => toast.success(i18n.raw("components.toastSuccessMsg", "Operación realizada con éxito"), { title: i18n.raw("components.toastSuccessTitle", "Completado") }),
          },
          i18n.t("components.toastSuccessBtn", "Éxito"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => toast.info(i18n.raw("components.toastInfoMsg", "Hay una nueva actualización disponible"), { title: i18n.raw("components.toastInfoTitle", "Novedad") }),
          },
          i18n.t("components.toastInfoBtn", "Información"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => toast.warning(i18n.raw("components.toastWarningMsg", "La sesión expirará en 5 minutos"), { title: i18n.raw("components.toastWarningTitle", "Aviso") }),
          },
          i18n.t("components.toastWarningBtn", "Advertencia"),
        ),
        Button(
          {
            variant: "destructive",
            onclick: () => toast.error(i18n.raw("components.toastErrorMsg", "No se pudo conectar con el servidor"), { title: i18n.raw("components.toastErrorTitle", "Fallo") }),
          },
          i18n.t("components.toastErrorBtn", "Error"),
        ),
      ),
    ),

    // 8. Modal Clásico & Spinner
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.modals", "Modales")),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-5" },
        div(
          { class: "flex flex-wrap items-center gap-4" },
          Button(
            {
              variant: "secondary",
              onclick: () => {
                modal.set({
                  header: () => div({ class: "text-lg font-bold" }, i18n.raw("components.modalTitle", "Modal Básico VanUI")),
                  body: () => div({ class: "py-2 text-sm text-foreground-soft leading-relaxed" }, i18n.raw("components.modalBody", "Este modal es completamente reactivo y se monta/desmonta con estados nativos de VanJS.")),
                  footer: () =>
                    div(
                      { class: "flex justify-end gap-2" },
                      Button(
                        {
                          variant: "secondary",
                          onclick: () => modal.close(),
                        },
                        i18n.raw("components.modalClose", "Cerrar"),
                      ),
                      Button(
                        {
                          variant: "primary",
                          onclick: () => {
                            modal.close();
                            toast.success(i18n.raw("components.modalConfirmedToast", "Acción confirmada desde el modal"));
                          },
                        },
                        i18n.raw("components.modalAccept", "Aceptar"),
                      ),
                    ),
                });
                modal.open();
              },
            },
            i18n.t("components.openModalBtn", "Abrir Modal Básico"),
          ),
        ),
        // Spin en su propia franja centrada: junto al botón se veía descolgado.
        div(
          { class: "flex justify-center rounded-xl border border-border/60 bg-secondary/10" },
          Spin(i18n.t("components.spinMsg", "Indicador de carga...")),
        ),
      ),
      modal.dom(),
    ),

    // 9. Dashboard Layout & Sidebars (VanUI AppShell)
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.layoutsSection", "Layouts & Dashboard Shell")),
      p(
        { class: "text-sm text-foreground-soft" },
        i18n.t("components.layoutsDesc", "Estructura adaptable Mobile-First con Drawer deslizable en pantallas táctiles y Sidebar estática en escritorio."),
      ),
      div(
        { class: "p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4" },
        div(
          { class: "grid grid-cols-1 sm:grid-cols-3 gap-4" },
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "📱"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.mobileDrawerTitle", "Mobile-First Drawer")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.mobileDrawerDesc", "Backdrop oscurecido con desenfoque, cierre automático al seleccionar enlace y botón hamburguesa accesible.")),
          ),
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "🖥️"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.desktopSidebarTitle", "Desktop Sidebar")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.desktopSidebarDesc", "Panel lateral persistente con soporte para grupos de navegación, íconos, badges reactivos y pie de página de usuario.")),
          ),
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "🧭"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.headerSyncTitle", "HeaderBar & Router Sync")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.headerSyncDesc", "Sincronización automática de títulos y enlaces activos (aria-current) con el router singleton de la app.")),
          ),
        ),
      ),
    ),
  );
}
